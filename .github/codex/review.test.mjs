import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  SUMMARY, changedLines, fileAnchors, formatUsage, alreadyReviewed, createApi, eligible, fingerprint, gate,
  linkedIssues, publish, publishedFingerprints, requestNumber, selectFindings, validateResult,
} from './review.mjs';

const repository = 'owner/task-pro';
const head = 'a'.repeat(40);
const base = 'b'.repeat(40);
const trusted = 'c'.repeat(40);
const actor = { login: 'maintainer', type: 'User' };
const user = { login: 'contributor', type: 'User' };
const pr = () => ({
  number: 86, state: 'open', draft: false, user,
  head: { sha: head, repo: { full_name: repository } },
  base: { sha: base, ref: 'main', repo: { full_name: repository } },
});
const manifest = { number: 86, head, base, trusted, actor, repository, manual: true };
const finding = () => ({ path: 'frontend/src/app.ts', line: 12, side: 'RIGHT', title: 'Обробіть помилку API', body: 'Коли API повертає 500, форма зберігає loading і блокує наступну спробу.', priority: 'P1' });
const result = findings => ({ summary: 'Перевірено змінений код.', not_verified: ['Браузерний сценарій.'], findings });
const event = () => ({ action: 'created', repository: { default_branch: 'main' }, sender: actor,
  issue: { number: 86, pull_request: {} }, comment: { body: '/codex-review' } });

function mockApi({ pull = pr(), comments = [], inline = [], permissions = {}, lastPull, threads = inline.map(comment => ({ root: comment.id, resolved: false })), failSummary = false } = {}) {
  const calls = [];
  let pullCount = 0;
  const api = async (path, method = 'GET', body) => {
    calls.push({ path, method, body });
    if (method !== 'GET') {
      if (failSummary && path.startsWith('/issues')) throw new Error('summary failed');
      return { id: 9 };
    }
    if (path === '/pulls/86') {
      pullCount++;
      return structuredClone(pullCount > 1 && lastPull ? lastPull : pull);
    }
    if (path.includes('/collaborators/')) return { permission: permissions[path.split('/')[2]] ?? 'write' };
    if (path === '/actions/workflows/codex-review-trigger.yml') return { id: 7 };
    throw new Error(`Unexpected ${path}`);
  };
  api.all = async path => {
    if (path === '/issues/86/comments') return structuredClone(comments);
    if (path === '/pulls/86/comments') return structuredClone(inline);
    if (path === '/pulls/86/reviews') return [];
    if (path.startsWith('/pulls?')) return [{ number: 86 }];
    throw new Error(`Unexpected list ${path}`);
  };
  api.threads = async () => structuredClone(threads);
  api.calls = calls;
  return api;
}

test('top-level exact command and valid dispatch PR number', () => {
  assert.equal(requestNumber(event(), 'issue_comment'), 86);
  assert.equal(requestNumber({ inputs: { pull_request: '86' } }, 'workflow_dispatch'), 86);
  for (const body of ['/codex-review please', '@codex review', 'text\n/codex-review', '/codex-review\nextra']) {
    const value = event(); value.comment.body = body;
    assert.equal(requestNumber(value, 'issue_comment'), null);
  }
  for (const value of ['-1', '0', '1; echo', '1.5', '', '01']) {
    assert.equal(requestNumber({ inputs: { pull_request: value } }, 'workflow_dispatch'), null);
  }
  const issue = event(); delete issue.issue.pull_request;
  assert.equal(requestNumber(issue, 'issue_comment'), null);
  const edit = event(); edit.action = 'edited';
  assert.equal(requestNumber(edit, 'issue_comment'), null);
});

test('only current write, maintain, admin human collaborators qualify', () => {
  for (const permission of ['write', 'maintain', 'admin']) assert.equal(eligible(pr(), repository, actor, permission, permission), true);
  for (const permission of ['read', 'triage', 'none']) {
    assert.equal(eligible(pr(), repository, actor, permission, 'write'), false);
    assert.equal(eligible(pr(), repository, actor, 'write', permission), false);
  }
  assert.equal(eligible(pr(), repository, { ...actor, type: 'Bot' }, 'admin', 'admin'), false);
});

for (const [name, mutate] of [
  ['draft', value => { value.draft = true; }],
  ['closed', value => { value.state = 'closed'; }],
  ['fork', value => { value.head.repo.full_name = 'attacker/task-pro'; }],
  ['deleted fork', value => { value.head.repo = null; }],
  ['bot author', value => { value.user.type = 'Bot'; }],
  ['non-default target', value => { value.base.ref = 'feature'; }],
]) {
  test(`gate skips ${name}`, async () => {
    const pull = structuredClone(pr()); mutate(pull);
    assert.equal(await gate(mockApi({ pull }), event(), 'issue_comment', repository, trusted), null);
  });
}

test('gate uses actual permissions rather than author_association', async () => {
  const value = event(); value.comment.author_association = 'OWNER';
  const api = mockApi({ permissions: { maintainer: 'read' } });
  assert.equal(await gate(api, value, 'issue_comment', repository, trusted), null);
  assert.equal(await gate(mockApi(), event(), 'issue_comment', repository, trusted).then(value => value.head), head);
});

test('dispatch refuses a feature-branch workflow', async () => {
  const value = { ...event(), inputs: { pull_request: '86' } };
  assert.equal(await gate(mockApi(), value, 'workflow_dispatch', repository, trusted, 'refs/heads/feature'), null);
  assert.ok(await gate(mockApi(), value, 'workflow_dispatch', repository, trusted, 'refs/heads/main'));
});

function automaticEvent() {
  return { ...event(), action: 'completed', workflow_run: {
    conclusion: 'success', event: 'pull_request', workflow_id: 7, head_sha: head,
    head_repository: { full_name: repository }, repository: { full_name: repository },
    actor, triggering_actor: actor, pull_requests: [{ number: 86 }], head_branch: 'feature',
  } };
}

test('workflow_run validates source identity and latest SHA without artifacts', async () => {
  assert.ok(await gate(mockApi(), automaticEvent(), 'workflow_run', repository, trusted));
  for (const mutate of [
    source => { source.workflow_id = 8; }, source => { source.event = 'push'; },
    source => { source.conclusion = 'failure'; }, source => { source.head_sha = base; },
    source => { source.head_repository.full_name = 'fork/task-pro'; },
    source => { source.repository.full_name = 'fork/task-pro'; },
    source => { source.triggering_actor.type = 'Bot'; },
  ]) {
    const value = structuredClone(automaticEvent()); mutate(value.workflow_run);
    assert.equal(await gate(mockApi(), value, 'workflow_run', repository, trusted), null);
  }
});

test('workflow_run resolves an omitted PR association using live branch lookup', async () => {
  const value = automaticEvent(); value.workflow_run.pull_requests = [];
  assert.ok(await gate(mockApi(), value, 'workflow_run', repository, trusted));
});

test('same-HEAD summary skips automatic review but allows explicit manual requests', async () => {
  const comments = [{ user: { login: 'github-actions[bot]' }, body: `${SUMMARY}\n<!-- head:${head} -->` }];
  assert.equal(alreadyReviewed(comments, head), true);
  assert.ok(await gate(mockApi({ comments }), event(), 'issue_comment', repository, trusted));
  assert.ok(await gate(mockApi({ comments }), { ...event(), inputs: { pull_request: '86' } }, 'workflow_dispatch', repository, trusted, 'refs/heads/main'));
  assert.equal(await gate(mockApi({ comments }), automaticEvent(), 'workflow_run', repository, trusted), null);
  comments[0].user.login = 'human';
  assert.equal(alreadyReviewed(comments, head), false);
  assert.ok(await gate(mockApi({ comments }), event(), 'issue_comment', repository, trusted));
});

test('only direct same-repo issues enter acceptance context', () => {
  assert.deepEqual(linkedIssues('Closes #12, see https://github.com/owner/task-pro/issues/13 and #12.\nhttps://github.com/other/task-pro/issues/14 owner/other#15', repository), [13, 12]);
  assert.throws(() => linkedIssues(Array.from({ length: 11 }, (_, index) => `#${index + 1}`).join(' '), repository));
});

test('diff parser accepts added RIGHT lines, excluding deletion hunks', () => {
  assert.deepEqual([...changedLines('@@ -1,2 +1,0 @@\n-a\n-b\n@@ -8 +9,2 @@\n-old\n+new\n+next\n@@ -19 +22 @@\n-before\n+after').RIGHT], [9, 10, 22]);
});

test('strict schema rejects malformed and oversized findings before any post', () => {
  assert.deepEqual(validateResult(JSON.stringify(result([finding()]))), result([finding()]));
  for (const invalid of [
    { ...result([]), extra: 'x' }, { ...result([]), summary: 5 }, { ...result([]), not_verified: [false] },
    result(Array(6).fill(finding())), result([{ ...finding(), line: '12' }]),
    result([{ ...finding(), priority: 'P3' }]), result([{ ...finding(), path: '../key' }]),
    result([{ ...finding(), path: '/etc/passwd' }]), result([{ ...finding(), path: 'a\nb' }]),
    result([{ ...finding(), title: '' }]), result([{ ...finding(), extra: true }]),
  ]) assert.throws(() => validateResult(JSON.stringify(invalid)));
  assert.throws(() => validateResult('x'.repeat(32_001)));
  assert.throws(() => validateResult('not json'));
});

test('fingerprints survive moved lines and normalized title; human marker ignored', () => {
  const current = finding();
  const previous = { ...current, title: ` ${current.title.toUpperCase()} `, line: 90 };
  assert.equal(fingerprint(current), fingerprint(previous));
  const body = `<!-- taskpro-codex-finding:${fingerprint(current)} -->`;
  assert.equal(publishedFingerprints([{ user: { login: 'human' }, body }]).size, 0);
  assert.equal(publishedFingerprints([{ user: { login: 'github-actions[bot]' }, body }]).size, 1);
});

test('publisher selection discards invalid lines/paths, duplicate output and prior findings', () => {
  const current = finding();
  const lines = new Map([[current.path, { RIGHT: new Set([12]), LEFT: new Set() }]]);
  assert.equal(selectFindings(result([current, current]), lines, new Set()).accepted.length, 1);
  assert.equal(selectFindings(result([current]), lines, new Set([fingerprint(current)])).accepted.length, 0);
  const selected = selectFindings(result([{ ...current, line: 13 }, { ...current, path: 'missing' }]), lines, new Set());
  assert.equal(selected.accepted.length, 0);
  assert.equal(selected.rejected.length, 2);
});

test('publisher batches findings in a COMMENT review and creates stable summary', async () => {
  const api = mockApi();
  const current = finding();
  const outcome = await publish(api, manifest, JSON.stringify(result([current])), new Map([[current.path, { RIGHT: new Set([12]), LEFT: new Set() }]]));
  assert.deepEqual(outcome, { published: 1, rejected: 0 });
  const writes = api.calls.filter(call => call.method !== 'GET');
  assert.equal(writes.length, 2);
  assert.equal(writes[0].path, '/pulls/86/reviews');
  assert.equal(writes[0].body.event, 'COMMENT');
  assert.equal(writes[0].body.commit_id, head);
  assert.equal(writes[0].body.comments.length, 1);
  assert.equal(writes[0].body.comments[0].side, 'RIGHT');
  assert.match(writes[1].body.body, /taskpro-codex-review/);
});

test('publisher updates bot summary, ignores human spoof and removes mentions/hidden markers', async () => {
  const api = mockApi({ comments: [
    { id: 1, user: { login: 'human' }, body: SUMMARY },
    { id: 2, user: { login: 'github-actions[bot]' }, body: SUMMARY },
  ] });
  const value = result([]); value.summary = 'Hi @maintainer <!-- head:fake -->';
  await publish(api, manifest, JSON.stringify(value), new Map());
  const last = api.calls.at(-1);
  assert.equal(last.path, '/issues/comments/2');
  assert.equal(last.method, 'PATCH');
  assert.ok(!last.body.body.includes('head:fake'));
  assert.ok(!last.body.body.includes('@maintainer'));
});

for (const [name, pull] of [
  ['head changed', { ...pr(), head: { ...pr().head, sha: base } }],
  ['base changed', { ...pr(), base: { ...pr().base, sha: head } }],
  ['closed', { ...pr(), state: 'closed' }],
  ['draft', { ...pr(), draft: true }],
]) {
  test(`publisher skips ${name} before posting`, async () => {
    const api = mockApi({ pull });
    assert.ok((await publish(api, manifest, JSON.stringify(result([])), new Map())).skipped);
    assert.equal(api.calls.filter(call => call.method !== 'GET').length, 0);
  });
}

test('publisher rechecks SHA immediately before the atomic review', async () => {
  const api = mockApi({ lastPull: { ...pr(), head: { ...pr().head, sha: base } } });
  assert.ok((await publish(api, manifest, JSON.stringify(result([])), new Map())).skipped);
  assert.equal(api.calls.filter(call => call.method !== 'GET').length, 0);
});

test('publisher refuses malformed output and changed permissions', async () => {
  const api = mockApi();
  await assert.rejects(publish(api, manifest, 'invalid', new Map()));
  assert.equal(api.calls.length, 0);
  const denied = mockApi({ permissions: { contributor: 'read' } });
  assert.ok((await publish(denied, manifest, JSON.stringify(result([])), new Map())).skipped);
  assert.equal(denied.calls.filter(call => call.method !== 'GET').length, 0);
});

test('existing inline fingerprints prevent duplicates after summary write failure', async () => {
  const current = finding();
  const api = mockApi({ inline: [{ user: { login: 'github-actions[bot]' }, body: `<!-- taskpro-codex-finding:${fingerprint(current)} -->` }] });
  assert.deepEqual(await publish(api, manifest, JSON.stringify(result([current])), new Map([[current.path, { RIGHT: new Set([12]), LEFT: new Set() }]])), { published: 0, rejected: 0 });
  assert.equal(api.calls.filter(call => call.path === '/pulls/86/reviews' && call.method === 'POST').length, 0);
});

test('invalid anchors are reported in summary without an invalid inline API call', async () => {
  const api = mockApi();
  const outcome = await publish(api, manifest, JSON.stringify(result([finding()])), new Map());
  assert.equal(outcome.rejected, 1);
  assert.equal(api.calls.filter(call => call.path === '/pulls/86/reviews' && call.method === 'POST').length, 0);
  assert.match(api.calls.at(-1).body.body, /Відкинуто findings/);
});

test('API pagination reads every page and never treats an error as missing context', async () => {
  let count = 0;
  const api = createApi(repository, 'fixture', async () => ({ ok: true, status: 200, json: async () => ++count === 1 ? Array(100).fill({ id: 1 }) : [{ id: 2 }] }));
  assert.equal((await api.all('/issues/86/comments')).length, 101);
  const failed = createApi(repository, 'fixture', async () => ({ ok: false, status: 403 }));
  await assert.rejects(failed.all('/issues/86/comments'), /403/);
});

test('workflow trust boundaries and setup failure stay explicit', () => {
  const workflow = readFileSync(new URL('../workflows/codex-review.yml', import.meta.url), 'utf8');
  const trigger = readFileSync(new URL('../workflows/codex-review-trigger.yml', import.meta.url), 'utf8');
  assert.ok(!workflow.includes('pull_request_target'));
  assert.ok(!trigger.includes('checkout'));
  assert.ok(!trigger.includes('secrets.'));
  assert.ok(workflow.includes('run: node .github/codex/responses.mjs'));
  assert.ok(!workflow.includes('openai/codex-action@'));
  assert.ok(!workflow.includes('codex-version:'));
  const reviewStep = workflow.split('      - name: Review pinned PR data with Responses API')[1].split('  publish:')[0];
  assert.ok(!reviewStep.includes('GH_TOKEN'));
  assert.ok(reviewStep.includes('OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}'));
  assert.ok(workflow.includes('KEY_CONFIGURED'));
  assert.ok(workflow.includes('OPENAI_API_KEY'));
  assert.equal((workflow.match(/pull-requests: write/g) ?? []).length, 1);
  const schema = JSON.parse(readFileSync(new URL('./schema.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(schema.properties).sort(), Object.keys(result([])).sort());
  assert.deepEqual(Object.keys(schema.properties.findings.items.properties).sort(), Object.keys(finding()).sort());
});

test('deleted authorization check and deleted files support LEFT anchors', async () => {
  const lines = changedLines('@@ -12,2 +11,0 @@\n-if (!session) throw forbidden;\n-return secret;');
  assert.deepEqual([...lines.LEFT], [12, 13]);
  assert.equal(lines.RIGHT.size, 0);
  const api = mockApi();
  await publish(api, manifest, JSON.stringify(result([{ ...finding(), side: 'LEFT' }])), new Map([[finding().path, lines]]));
  const posted = api.calls.find(call => call.path === '/pulls/86/reviews' && call.method === 'POST');
  assert.equal(posted.body.comments[0].side, 'LEFT');
  assert.equal(posted.body.comments[0].line, 12);
});

test('resolved bot finding can be reported again when the defect returns', async () => {
  const current = finding();
  const inline = [{ id: 42, user: { login: 'github-actions[bot]' }, body: `<!-- taskpro-codex-finding:${fingerprint(current)} -->` }];
  const lines = new Map([[current.path, { RIGHT: new Set([12]), LEFT: new Set() }]]);
  const active = mockApi({ inline, threads: [{ root: 42, resolved: false }] });
  assert.equal((await publish(active, manifest, JSON.stringify(result([current])), lines)).published, 0);
  const resolved = mockApi({ inline, threads: [{ root: 42, resolved: true }] });
  assert.equal((await publish(resolved, manifest, JSON.stringify(result([current])), lines)).published, 1);
});

test('same-HEAD manual re-review updates summary without an empty review', async () => {
  const api = mockApi({ comments: [{ id: 2, user: { login: 'github-actions[bot]' }, body: `${SUMMARY}\n<!-- head:${head} -->` }] });
  assert.equal((await publish(api, manifest, JSON.stringify(result([])), new Map())).published, 0);
  assert.equal(api.calls.filter(call => call.path === '/pulls/86/reviews' && call.method === 'POST').length, 0);
  assert.equal(api.calls.at(-1).method, 'PATCH');
});

test('review thread pagination includes resolution state and root comment IDs', async () => {
  let count = 0;
  const api = createApi(repository, 'fixture', async () => ({ ok: true, json: async () => ({ data: { repository: { pullRequest: { reviewThreads: {
    nodes: [{ isResolved: count === 1, comments: { nodes: [{ databaseId: ++count }] } }],
    pageInfo: { hasNextPage: count === 1, endCursor: 'next' },
  } } } } }) }));
  assert.deepEqual(await api.threads(86), [{ root: 1, resolved: false }, { root: 2, resolved: true }]);
  const failed = createApi(repository, 'fixture', async () => ({ ok: true, json: async () => ({ errors: [{ message: 'denied' }] }) }));
  await assert.rejects(failed.threads(86), /GraphQL failed/);
});

test('GitHub renamed file uses new filename for LEFT and excludes unchanged context', async () => {
  const files = [{ filename: 'frontend/src/new.ts', previous_filename: 'frontend/src/old.ts', status: 'renamed',
    patch: '@@ -10,4 +10,3 @@\n unchanged\n-if (!session) throw forbidden;\n return secret;\n end' }];
  const anchors = fileAnchors(files);
  assert.equal(anchors.has('frontend/src/old.ts'), false);
  assert.deepEqual([...anchors.get('frontend/src/new.ts').LEFT], [11]);
  assert.equal(anchors.get('frontend/src/new.ts').RIGHT.size, 0);
  const api = mockApi();
  const originalAll = api.all;
  api.all = async path => path === '/pulls/86/files' ? files : originalAll(path);
  const current = { ...finding(), path: files[0].filename, line: 11, side: 'LEFT' };
  assert.equal((await publish(api, manifest, JSON.stringify(result([current])))).published, 1);
  const posted = api.calls.find(call => call.path === '/pulls/86/reviews' && call.method === 'POST');
  assert.equal(posted.body.comments[0].path, 'frontend/src/new.ts');
});

test('missing GitHub patch yields no invented inline anchors', () => {
  const anchors = fileAnchors([{ filename: 'binary.png' }]);
  assert.equal(anchors.get('binary.png').RIGHT.size, 0);
  assert.equal(anchors.get('binary.png').LEFT.size, 0);
});

test('a workflow rerun by a different actor must use a new explicit request', async () => {
  assert.equal(await gate(mockApi(), event(), 'issue_comment', repository, trusted, undefined, 'other'), null);
});

test('canonical API handles deleted files, type changes and pure renames', () => {
  const anchors = fileAnchors([
    { filename: 'deleted.ts', status: 'removed', patch: '@@ -1,2 +0,0 @@\n-auth();\n-return secret;' },
    { filename: 'type.ts', status: 'changed', patch: '@@ -1 +1 @@\n-old\n+new' },
    { filename: 'renamed.ts', previous_filename: 'old.ts', status: 'renamed', additions: 0, deletions: 0 },
  ]);
  assert.deepEqual([...anchors.get('deleted.ts').LEFT], [1, 2]);
  assert.equal(anchors.get('deleted.ts').RIGHT.size, 0);
  assert.deepEqual([...anchors.get('type.ts').RIGHT], [1]);
  assert.equal(anchors.get('renamed.ts').LEFT.size + anchors.get('renamed.ts').RIGHT.size, 0);
});

test('SHA changing while canonical files are read skips publication', async () => {
  const api = mockApi({ lastPull: { ...pr(), head: { ...pr().head, sha: base } } });
  const originalAll = api.all;
  let filesRead = false;
  api.all = async path => {
    if (path === '/pulls/86/files') { filesRead = true; return []; }
    return originalAll(path);
  };
  assert.ok((await publish(api, manifest, JSON.stringify(result([])))).skipped);
  assert.equal(filesRead, true);
  assert.equal(api.calls.filter(call => call.method !== 'GET').length, 0);
});

test('missing canonical patches are visible in summary even without findings', async () => {
  const api = mockApi();
  const originalAll = api.all;
  api.all = async path => path === '/pulls/86/files' ? [{ filename: 'binary.png', status: 'modified' }] : originalAll(path);
  await publish(api, manifest, JSON.stringify(result([])));
  assert.match(api.calls.at(-1).body.body, /GitHub не повернув patch.*binary.png/s);
});

test('usage formatter identifies complete, partial and unavailable counts without fabricated zeroes', () => {
  const usage = { requests: 2, tool_calls: 1, input_tokens: 357, output_tokens: 101, usage_responses: 2 };
  assert.equal(formatUsage(JSON.stringify(usage)), 'Токени цього запуску: вхідні 357 · вихідні 101 · разом 458.');
  assert.equal(formatUsage(JSON.stringify({ ...usage, usage_responses: 1 })), 'Токени цього запуску: вхідні 357 · вихідні 101 · разом 458, за 1 із 2 запитів. Дані неповні.');
  for (const value of [undefined, '', 'invalid', JSON.stringify({ ...usage, usage_responses: 0 })]) {
    assert.equal(formatUsage(value), 'Токени цього запуску: дані недоступні.');
  }
  assert.equal(formatUsage(JSON.stringify({ ...usage, input_tokens: 0, output_tokens: 0 })), 'Токени цього запуску: вхідні 0 · вихідні 0 · разом 0.');
});

test('publisher usage formatter rejects unsafe or inconsistent metadata', () => {
  const usage = { requests: 2, tool_calls: 1, input_tokens: 100, output_tokens: 20, usage_responses: 2 };
  for (const changed of [
    { input_tokens: '100' }, { input_tokens: -1 }, { input_tokens: 1.5 }, { requests: 0 }, { requests: 7 },
    { usage_responses: 3 }, { usage_responses: -1 }, { tool_calls: 31 },
    { input_tokens: Number.MAX_SAFE_INTEGER, output_tokens: 1 }, { extra: 'model-controlled' },
  ]) assert.equal(formatUsage(JSON.stringify({ ...usage, ...changed })), 'Токени цього запуску: дані недоступні.');
  assert.equal(formatUsage('x'.repeat(1001)), 'Токени цього запуску: дані недоступні.');
});

test('publisher updates summary with this run usage separately from model JSON and prior reviews', async () => {
  const api = mockApi({ comments: [{ id: 2, user: { login: 'github-actions[bot]' }, body: `${SUMMARY}\nТокени попереднього запуску: 9999` }] });
  const usage = { requests: 2, tool_calls: 1, input_tokens: 357, output_tokens: 101, usage_responses: 2 };
  await publish(api, manifest, JSON.stringify(result([])), new Map(), JSON.stringify(usage));
  assert.equal(api.calls.at(-1).method, 'PATCH');
  assert.match(api.calls.at(-1).body.body, /Токени цього запуску: вхідні 357 · вихідні 101 · разом 458\./);
  assert.ok(!api.calls.at(-1).body.body.includes('9999'));
  await assert.rejects(publish(mockApi(), manifest, JSON.stringify({ ...result([]), usage }), new Map()), /schema/);
});

test('publisher displays partial and unavailable usage explicitly', async () => {
  const api = mockApi();
  const partial = { requests: 2, tool_calls: 1, input_tokens: 100, output_tokens: 20, usage_responses: 1 };
  await publish(api, manifest, JSON.stringify(result([])), new Map(), JSON.stringify(partial));
  assert.match(api.calls.at(-1).body.body, /за 1 із 2 запитів. Дані неповні/);
  const missing = mockApi();
  await publish(missing, manifest, JSON.stringify(result([])), new Map());
  assert.match(missing.calls.at(-1).body.body, /Токени цього запуску: дані недоступні/);
});

test('workflow forwards trusted usage output outside the structured model result', () => {
  const workflow = readFileSync(new URL('../workflows/codex-review.yml', import.meta.url), 'utf8');
  const runner = readFileSync(new URL('./responses.mjs', import.meta.url), 'utf8');
  assert.ok(workflow.includes('usage: ${{ steps.review.outputs.usage }}'));
  assert.ok(workflow.includes('REVIEW_USAGE: ${{ needs.analyze.outputs.usage }}'));
  assert.ok(runner.includes('aggregateUsage = usage'));
  assert.ok(runner.includes('usage=${JSON.stringify(aggregateUsage)}'));
  assert.ok(!runner.includes('result.usage'));
});
