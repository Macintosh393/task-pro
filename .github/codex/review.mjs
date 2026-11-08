import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const SUMMARY = '<!-- taskpro-codex-review -->';
const BOT = 'github-actions[bot]';
const SHA = /^[a-f0-9]{40}$/;
const WRITE = new Set(['write', 'maintain', 'admin']);
const MAX_OUTPUT = 32_000;

export function requestNumber(event, name) {
  if (name === 'issue_comment') {
    if (event.action !== 'created' || !event.issue?.pull_request || event.comment?.body !== '/codex-review') return null;
    return event.issue.number;
  }
  if (name === 'workflow_dispatch') {
    const value = String(event.inputs?.pull_request ?? '');
    return /^[1-9]\d{0,8}$/.test(value) ? Number(value) : null;
  }
  return null;
}

export function eligible(pr, repository, actor, actorPermission, authorPermission) {
  return pr.state === 'open' && !pr.draft && pr.head?.repo?.full_name === repository &&
    pr.base?.repo?.full_name === repository && pr.user?.type === 'User' && actor?.type === 'User' &&
    WRITE.has(actorPermission) && WRITE.has(authorPermission);
}

export function fingerprint(finding) {
  const normalize = value => value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
  return createHash('sha256').update(`${finding.path}\n${normalize(finding.title)}`).digest('hex');
}

export function publishedFingerprints(comments) {
  return new Set(comments.filter(comment => comment.user?.login === BOT).flatMap(comment =>
    [...(comment.body ?? '').matchAll(/<!-- taskpro-codex-finding:([a-f0-9]{64}) -->/g)].map(match => match[1])));
}

export function alreadyReviewed(comments, head) {
  return comments.some(comment => comment.user?.login === BOT && comment.body?.startsWith(SUMMARY) &&
    comment.body.includes(`<!-- head:${head} -->`));
}

function exactKeys(value, keys) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).sort().join(',') === [...keys].sort().join(',');
}

export function validateResult(raw) {
  if (typeof raw !== 'string' || Buffer.byteLength(raw) > MAX_OUTPUT) throw new Error('Review output exceeds 32 KB');
  const result = JSON.parse(raw);
  if (!exactKeys(result, ['summary', 'not_verified', 'findings']) ||
      typeof result.summary !== 'string' || result.summary.length > 2000 ||
      !Array.isArray(result.not_verified) || result.not_verified.length > 8 ||
      result.not_verified.some(value => typeof value !== 'string' || value.length > 500) ||
      !Array.isArray(result.findings) || result.findings.length > 5) throw new Error('Invalid review schema');
  for (const finding of result.findings) {
    if (!exactKeys(finding, ['path', 'line', 'side', 'title', 'body', 'priority']) ||
        typeof finding.path !== 'string' || !finding.path || finding.path.length > 500 ||
        finding.path.startsWith('/') || finding.path.split('/').some(part => part === '..' || !part) || /[\x00-\x1f\\]/.test(finding.path) ||
        !Number.isSafeInteger(finding.line) || finding.line < 1 || !['LEFT', 'RIGHT'].includes(finding.side) ||
        !['P0', 'P1', 'P2'].includes(finding.priority) ||
        typeof finding.title !== 'string' || !finding.title.trim() || finding.title.length > 140 ||
        typeof finding.body !== 'string' || !finding.body.trim() || finding.body.length > 2000) throw new Error('Invalid finding schema');
  }
  return result;
}

export function selectFindings(result, changedLines, previous) {
  const seen = new Set(previous);
  const accepted = [];
  const rejected = [];
  for (const finding of result.findings) {
    const id = fingerprint(finding);
    if (!changedLines.get(finding.path)?.[finding.side]?.has(finding.line)) {
      rejected.push(`${finding.path}:${finding.line}`);
    } else if (!seen.has(id)) {
      seen.add(id);
      accepted.push({ ...finding, fingerprint: id });
    }
  }
  return { accepted, rejected };
}

export function createApi(repository, token, fetcher = fetch) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error('Invalid repository');
  async function api(path, method = 'GET', body) {
    const response = await fetcher(`https://api.github.com/repos/${repository}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`GitHub ${method} ${path.split('?')[0]} returned ${response.status}`);
    return response.status === 204 ? null : response.json();
  }
  api.all = async path => {
    const records = [];
    for (let page = 1; page <= 20; page++) {
      const batch = await api(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
      records.push(...batch);
      if (batch.length < 100) return records;
    }
    throw new Error('GitHub context exceeds 2000 records; review manually');
  };
  api.threads = async number => {
    const [owner, name] = repository.split('/');
    const threads = [];
    let after = null;
    for (let page = 0; page < 20; page++) {
      const response = await fetcher('https://api.github.com/graphql', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'query($owner:String!,$name:String!,$number:Int!,$after:String){repository(owner:$owner,name:$name){pullRequest(number:$number){reviewThreads(first:100,after:$after){nodes{isResolved comments(first:1){nodes{databaseId}}} pageInfo{hasNextPage endCursor}}}}}',
          variables: { owner, name, number, after },
        }), signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`GitHub review threads returned ${response.status}`);
      const data = await response.json();
      if (data.errors?.length) throw new Error('GitHub review threads GraphQL failed');
      const connection = data.data?.repository?.pullRequest?.reviewThreads;
      if (!connection || connection.nodes.some(thread => typeof thread.isResolved !== 'boolean' || !Number.isSafeInteger(thread.comments?.nodes?.[0]?.databaseId))) throw new Error('Invalid review thread context');
      threads.push(...connection.nodes.map(thread => ({ resolved: thread.isResolved, root: thread.comments.nodes[0].databaseId })));
      if (!connection.pageInfo.hasNextPage) return threads;
      after = connection.pageInfo.endCursor;
    }
    throw new Error('More than 2000 review threads; review manually');
  };
  return api;
}

async function permission(api, login) {
  try { return (await api(`/collaborators/${encodeURIComponent(login)}/permission`)).permission; }
  catch (error) {
    if (/returned (403|404)$/.test(error.message)) return 'none';
    throw error;
  }
}

async function authorized(api, pr, repository, actor) {
  if (!actor?.login || !pr.user?.login) return false;
  const [actorPermission, authorPermission] = await Promise.all([
    permission(api, actor.login), permission(api, pr.user.login),
  ]);
  return eligible(pr, repository, actor, actorPermission, authorPermission);
}

export async function gate(api, event, name, repository, trustedSha, ref, triggeringActor) {
  const defaultBranch = event.repository.default_branch;
  let number = requestNumber(event, name);
  let actor = event.sender;
  if (triggeringActor && triggeringActor !== event.sender?.login) return null;
  if (name === 'workflow_dispatch' && ref !== `refs/heads/${defaultBranch}`) return null;
  if (name === 'workflow_run') {
    const source = event.workflow_run;
    const workflow = await api('/actions/workflows/codex-review-trigger.yml');
    if (event.action !== 'completed' || source.conclusion !== 'success' || source.event !== 'pull_request' ||
        source.workflow_id !== workflow.id || source.head_repository?.full_name !== repository ||
        source.repository?.full_name !== repository) return null;
    actor = source.triggering_actor ?? source.actor;
    const candidates = source.pull_requests?.length ? source.pull_requests :
      await api.all(`/pulls?state=open&head=${encodeURIComponent(`${repository.split('/')[0]}:${source.head_branch}`)}`);
    if (candidates.length !== 1) return null;
    number = candidates[0].number;
  }
  if (!Number.isSafeInteger(number) || number < 1) return null;
  const pr = await api(`/pulls/${number}`);
  if (pr.base.ref !== defaultBranch || !await authorized(api, pr, repository, actor)) return null;
  if (name === 'workflow_run' && pr.head.sha !== event.workflow_run.head_sha) return null;
  if (![trustedSha, pr.base.sha, pr.head.sha].every(value => SHA.test(value))) throw new Error('Invalid commit SHA');
  const comments = await api.all(`/issues/${number}/comments`);
  if (name === 'workflow_run' && alreadyReviewed(comments, pr.head.sha)) return null;
  return { number, head: pr.head.sha, base: pr.base.sha, trusted: trustedSha, actor, repository, manual: name !== 'workflow_run' };
}

export function linkedIssues(body, repository) {
  const ids = new Set();
  const escaped = repository.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const match of body.matchAll(new RegExp(`https://github\\.com/${escaped}/issues/([1-9]\\d*)\\b`, 'g'))) ids.add(Number(match[1]));
  for (const match of body.matchAll(/(?:^|[\s(])#([1-9]\d*)\b/g)) ids.add(Number(match[1]));
  if (ids.size > 10) throw new Error('More than 10 directly linked issues; narrow the PR description');
  return [...ids];
}

function git(...args) {
  return execFileSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'core.quotePath=false', ...args], {
    encoding: 'utf8', maxBuffer: 2_000_000,
    env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null', GIT_TERMINAL_PROMPT: '0' },
  });
}

function fetchObjects(manifest) {
  if (![manifest.base, manifest.head].every(value => SHA.test(value))) throw new Error('Invalid manifest SHA');
  const auth = Buffer.from(`x-access-token:${process.env.GH_TOKEN}`).toString('base64');
  execFileSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', `http.https://github.com/.extraheader=AUTHORIZATION: basic ${auth}`,
    'fetch', '--no-tags', 'origin', manifest.base, manifest.head], { stdio: ['ignore', 'ignore', 'ignore'] });
}

export function changedLines(patch) {
  const lines = { LEFT: new Set(), RIGHT: new Set() };
  let left = 0;
  let right = 0;
  let inHunk = false;
  for (const line of patch.split('\n')) {
    const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (hunk) {
      left = Number(hunk[1]); right = Number(hunk[2]); inHunk = true;
    } else if (inHunk && line.startsWith('-')) {
      lines.LEFT.add(left++);
    } else if (inHunk && line.startsWith('+')) {
      lines.RIGHT.add(right++);
    } else if (inHunk && line.startsWith(' ')) {
      left++; right++;
    } else if (line.startsWith('diff --git ')) {
      inHunk = false;
    }
  }
  return lines;
}

export function fileAnchors(files) {
  if (files.length > 100) throw new Error('More than 100 changed files; review manually');
  return new Map(files.map(file => [file.filename, changedLines(file.patch ?? '')]));
}

function diffContext(manifest) {
  const mergeBase = git('merge-base', manifest.base, manifest.head).trim();
  const paths = git('diff', '--no-ext-diff', '--no-textconv', '--find-renames', '--name-only', '-z', mergeBase, manifest.head).split('\0').filter(Boolean);
  if (paths.length > 100) throw new Error('More than 100 changed files; review manually');
  const diff = git('diff', '--no-ext-diff', '--no-textconv', '--find-renames', '--unified=3', mergeBase, manifest.head);
  if (Buffer.byteLength(diff) > 250_000) throw new Error('Diff exceeds 250 KB; split the PR or review manually');
  return { mergeBase, diff };
}

async function liveContext(api, manifest) {
  const pr = await api(`/pulls/${manifest.number}`);
  if (pr.head.sha !== manifest.head || pr.base.sha !== manifest.base || !await authorized(api, pr, manifest.repository, manifest.actor)) return null;
  const [comments, reviews, inline, threads] = await Promise.all([
    api.all(`/issues/${manifest.number}/comments`), api.all(`/pulls/${manifest.number}/reviews`), api.all(`/pulls/${manifest.number}/comments`), api.threads(manifest.number),
  ]);
  return { pr, comments, reviews, inline, threads };
}

export async function collect(api, manifest) {
  const context = await liveContext(api, manifest);
  if (!context || (!manifest.manual && alreadyReviewed(context.comments, manifest.head))) return false;
  fetchObjects(manifest);
  const { mergeBase, diff } = diffContext(manifest);
  const files = await api.all(`/pulls/${manifest.number}/files`);
  fileAnchors(files);
  const issues = [];
  for (const number of linkedIssues(context.pr.body ?? '', manifest.repository)) {
    const issue = await api(`/issues/${number}`);
    if (!issue.pull_request) issues.push({ number, title: issue.title, body: issue.body });
  }
  const compact = records => records.map(item => ({
    id: item.id, user: item.user?.login, body: item.body, state: item.state,
    path: item.path, line: item.line, original_line: item.original_line, in_reply_to_id: item.in_reply_to_id,
  }));
  const data = JSON.stringify({
    number: manifest.number, base: manifest.base, head: manifest.head, merge_base: mergeBase, trusted: manifest.trusted,
    title: context.pr.title, description: context.pr.body, issues,
    files: files.map(file => ({ filename: file.filename, previous_filename: file.previous_filename, status: file.status, patch: file.patch ?? null })),
    review_threads: context.threads, conversation: compact(context.comments), reviews: compact(context.reviews), inline_threads: compact(context.inline),
  }, null, 2);
  if (Buffer.byteLength(data) > 200_000) throw new Error('PR context exceeds 200 KB; review manually');
  mkdirSync('.review-data', { recursive: true });
  writeFileSync('.review-data/context.json', data);
  writeFileSync('.review-data/diff.patch', diff);
  return true;
}

function safeMarkdown(text) {
  return text.replace(/<!--[\s\S]*?-->/g, '').replace(/@/g, '@\u200b').trim();
}

export async function publish(api, manifest, raw, anchors) {
  const result = validateResult(raw);
  const context = await liveContext(api, manifest);
  if (!context) return { skipped: 'stale or unauthorized' };
  if (!manifest.manual && alreadyReviewed(context.comments, manifest.head)) return { skipped: 'already reviewed' };
  const activeRoots = new Set(context.threads.filter(thread => !thread.resolved).map(thread => thread.root));
  const previous = publishedFingerprints(context.inline.filter(comment => activeRoots.has(comment.id)));
  const files = anchors ? null : await api.all(`/pulls/${manifest.number}/files`);
  const changed = anchors ?? fileAnchors(files);
  const missingPatches = (files ?? []).filter(file => !file.patch && !(file.status === 'renamed' && file.additions === 0 && file.deletions === 0)).map(file => file.filename);
  const { accepted, rejected } = selectFindings(result, changed, previous);
  const body = [
    SUMMARY, `<!-- head:${manifest.head} -->`, `OpenAI API review для \`${manifest.head.slice(0, 12)}\`.`,
    safeMarkdown(result.summary),
    `Нових findings: ${accepted.length}. Попередні зауваження не закриваються автоматично; відсутність у цьому review не підтверджує виправлення.`,
    ...(result.not_verified.length ? [`Не перевірено:\n${result.not_verified.map(value => `- ${safeMarkdown(value)}`).join('\n')}`] : []),
    ...(missingPatches.length ? [`GitHub не повернув patch для цих файлів; inline anchors недоступні: ${missingPatches.map(path => `\`${safeMarkdown(path)}\``).join(', ')}.`] : []),
    ...(rejected.length ? [`Відкинуто findings поза зміненими рядками: ${rejected.map(value => `\`${safeMarkdown(value)}\``).join(', ')}.`] : []),
    'Це автоматичний аналіз коду та доступних вимог. Він не підтверджує Figma-відповідність, поведінку браузера чи проходження тестів.',
  ].join('\n\n');
  const reviewBody = `OpenAI API: ${accepted.length} нових findings для \`${manifest.head.slice(0, 12)}\`. Деталі й межі перевірки в підсумковому коментарі.`;
  const comments = accepted.map(finding => ({
    path: finding.path, line: finding.line, side: finding.side,
    body: `<!-- taskpro-codex-finding:${finding.fingerprint} -->\n[${finding.priority}] ${safeMarkdown(finding.title)}\n\n${safeMarkdown(finding.body)}`,
  }));
  const check = await api(`/pulls/${manifest.number}`);
  if (check.head.sha !== manifest.head || check.base.sha !== manifest.base || check.state !== 'open' || check.draft) return { skipped: 'head or base changed' };
  if (comments.length) await api(`/pulls/${manifest.number}/reviews`, 'POST', { commit_id: manifest.head, event: 'COMMENT', body: reviewBody, comments });
  const existing = context.comments.find(comment => comment.user?.login === BOT && comment.body?.startsWith(SUMMARY));
  if (existing) await api(`/issues/comments/${existing.id}`, 'PATCH', { body });
  else await api(`/issues/${manifest.number}/comments`, 'POST', { body });
  return { published: accepted.length, rejected: rejected.length };
}

function output(key, value) {
  const delimiter = `codex_${createHash('sha256').update(String(value)).digest('hex')}`;
  appendFileSync(process.env.GITHUB_OUTPUT, `${key}<<${delimiter}\n${value}\n${delimiter}\n`);
}

async function main() {
  const api = createApi(process.env.GITHUB_REPOSITORY, process.env.GH_TOKEN);
  const command = process.argv[2];
  if (command === 'gate') {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const manifest = await gate(api, event, process.env.GITHUB_EVENT_NAME, process.env.GITHUB_REPOSITORY, git('rev-parse', 'HEAD').trim(), process.env.GITHUB_REF, process.env.GITHUB_TRIGGERING_ACTOR);
    output('allowed', String(Boolean(manifest)));
    if (manifest) {
      output('manifest', JSON.stringify(manifest));
      output('number', String(manifest.number));
      output('trusted', manifest.trusted);
    }
  } else if (command === 'collect') {
    output('proceed', String(await collect(api, JSON.parse(process.env.REVIEW_MANIFEST))));
  } else if (command === 'publish') {
    const manifest = JSON.parse(process.env.REVIEW_MANIFEST);
    console.log(JSON.stringify(await publish(api, manifest, process.env.REVIEW_RESULT)));
  } else throw new Error('Expected gate, collect or publish');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
