import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { BUDGET, runReview } from './responses.mjs';

const schema = JSON.parse(readFileSync(new URL('./schema.json', import.meta.url), 'utf8'));
const review = () => ({ summary: 'Перевірено source.', not_verified: [], findings: [] });
const message = (value = review(), phase = 'final_answer') => ({ type: 'message', role: 'assistant', phase,
  content: [{ type: 'output_text', text: JSON.stringify(value) }] });
const call = (id = 'call_1', name = 'read_source', args = { revision: 'head', path: 'src/app.ts', start_line: 1, end_line: 20 }) =>
  ({ type: 'function_call', call_id: id, name, arguments: JSON.stringify(args), status: 'completed' });
const completed = output => ({ status: 'completed', output, usage: { input_tokens: 100, output_tokens: 50 } });

function harness(responses, overrides = {}) {
  const requests = [];
  const invoked = [];
  const usage = [];
  const options = { apiKey: 'fixture-openai-key', prompt: 'Trusted review instructions', schema, input: 'PR context',
    sourceTools: { invoke: (name, args) => { invoked.push({ name, args }); return JSON.stringify({ lines: [{ line: 1, text: 'safe source' }] }); } },
    fetcher: async (url, request) => {
      requests.push({ url, ...request, body: JSON.parse(request.body) });
      const data = responses[requests.length - 1];
      if (!data) throw new Error('Unexpected request');
      return data instanceof Response ? data : new Response(JSON.stringify(data));
    }, onUsage: value => usage.push(structuredClone(value)), ...overrides };
  return { run: () => runReview(options), requests, invoked, usage };
}

test('direct Responses request uses strict schemas, default model/effort and no stored state', async () => {
  const value = harness([completed([message()])]);
  assert.deepEqual(await value.run(), review());
  const request = value.requests[0];
  assert.equal(request.url, 'https://api.openai.com/v1/responses');
  assert.equal(request.headers.Authorization, 'Bearer fixture-openai-key');
  assert.equal(request.redirect, 'error');
  assert.equal(request.body.model, 'gpt-6.1-sol');
  assert.equal(request.body.reasoning.effort, 'high');
  assert.equal(request.body.store, false);
  assert.equal(request.body.text.format.type, 'json_schema');
  assert.equal(request.body.text.format.strict, true);
  assert.deepEqual(request.body.text.format.schema, schema);
  assert.deepEqual(request.body.include, ['reasoning.encrypted_content']);
  assert.equal(request.body.max_output_tokens, 8000);
  assert.ok(!JSON.stringify(request.body).includes('fixture-openai-key'));
  assert.deepEqual(value.usage, [{ requests: 1, tool_calls: 0, input_tokens: 100, output_tokens: 50, usage_responses: 1 }]);
});

test('full output including encrypted reasoning, phases and function call items is replayed', async () => {
  const output = [{ type: 'reasoning', id: 'rs_1', encrypted_content: 'opaque-encrypted-content', summary: [] },
    { ...message('Читаю source.', 'commentary'), id: 'msg_1' }, call()];
  const value = harness([completed(output), completed([message()])]);
  await value.run();
  assert.deepEqual(value.requests[1].body.input.slice(1, 4), output);
  assert.equal(value.requests[1].body.input[4].type, 'function_call_output');
  assert.equal(value.requests[1].body.input[4].call_id, 'call_1');
  assert.equal(JSON.parse(value.requests[1].body.input[4].output).lines[0].text, 'safe source');
  assert.equal(value.invoked.length, 1);
  assert.equal(value.usage[0].input_tokens, 200);
});

test('multiple parallel function calls each get a bounded result and preserved call ID', async () => {
  const value = harness([completed([call('a'), call('b', 'list_source', { revision: 'trusted', prefix: 'src/', offset: 0, limit: 2 })]), completed([message()])]);
  await value.run();
  assert.equal(value.invoked.length, 2);
  assert.deepEqual(value.requests[1].body.input.filter(item => item.type === 'function_call_output').map(item => item.call_id), ['a', 'b']);
});

test('unique final_answer is selected while commentary is ignored', async () => {
  const value = harness([completed([message({ ...review(), summary: 'preamble' }, 'commentary'), message()])]);
  assert.deepEqual(await value.run(), review());
});

for (const [name, messages] of [
  ['commentary only', [message(review(), 'commentary')]],
  ['duplicate final answers', [message(), message()]],
  ['unphased with explicit commentary', [message(review(), undefined), message(review(), 'commentary')]],
  ['unknown phase', [message(review(), 'unknown')]],
]) test(`never publishes ${name}`, async () => {
  if (name.startsWith('unphased')) delete messages[0].phase;
  await assert.rejects(harness([completed(messages)]).run(), /no final structured review/);
});

test('single legacy unphased terminal message is accepted', async () => {
  const legacy = message(); delete legacy.phase;
  assert.deepEqual(await harness([completed([legacy])]).run(), review());
});

test('final budget round disables tools, adds instructions and records bounded coverage', async () => {
  const value = harness([completed([call()]), completed([message()])], { budget: { ...BUDGET, rounds: 2 } });
  const final = await value.run();
  assert.equal(value.requests.length, 2);
  assert.equal(value.requests[1].body.tool_choice, 'none');
  assert.match(value.requests[1].body.instructions, /tools вимкнено/);
  assert.match(final.not_verified[0], /ліміт дослідження/);
});

test('final coverage note preserves all existing eight limitations', async () => {
  const result = { ...review(), not_verified: Array.from({ length: 8 }, (_, index) => `check ${index}`) };
  const final = await harness([completed([message(result)])], { budget: { ...BUDGET, rounds: 1 } }).run();
  assert.equal(final.not_verified.length, 8);
  for (let index = 0; index < 8; index++) assert.ok(final.not_verified[index].includes(`check ${index}`));
  assert.match(final.not_verified[7], /ліміт дослідження/);
});

test('tool budget forces a final round and rejects tool requests during that round', async () => {
  const value = harness([completed([call()]), completed([call('call_2')])], { budget: { ...BUDGET, toolCalls: 1 } });
  await assert.rejects(value.run(), /final review round/);
  assert.equal(value.requests[1].body.tool_choice, 'none');
  assert.equal(value.invoked.length, 1);
});

test('excess tool calls, duplicate IDs and oversized tool outputs fail without another request', async () => {
  const excess = harness([completed([call('a'), call('b')])], { budget: { ...BUDGET, toolCalls: 1 } });
  await assert.rejects(excess.run(), /tool call budget/);
  assert.equal(excess.invoked.length, 0);
  const duplicate = harness([completed([call('a'), call('a')])]);
  await assert.rejects(duplicate.run(), /repeated tool call/);
  assert.equal(duplicate.requests.length, 1);
  const oversized = harness([completed([call()])], { sourceTools: { invoke: () => 'x'.repeat(16_001) } });
  await assert.rejects(oversized.run(), /bounded tool output/);
});

test('tool validation errors are returned to the model as data, never evaluated', async () => {
  const value = harness([completed([call('a', 'shell', { command: 'env' })]), completed([message()])],
    { sourceTools: { invoke: () => '{"error":"Unknown source tool"}' } });
  await value.run();
  assert.equal(value.requests[1].body.input.at(-1).output, '{"error":"Unknown source tool"}');
});

for (const status of [401, 429, 500]) test(`HTTP ${status} is not retried and body is not exposed`, async () => {
  const value = harness([new Response('private upstream error text', { status, headers: { 'Retry-After': '0' } })]);
  await assert.rejects(value.run(), error => error.message.includes(`HTTP ${status}`) && !error.message.includes('private upstream'));
  assert.equal(value.requests.length, 1);
  assert.equal(value.usage[0].requests, 1);
});

test('transport error is sanitized without retry', async () => {
  let count = 0;
  const value = harness([], { fetcher: async () => { count++; throw new Error('fixture-openai-key'); } });
  await assert.rejects(value.run(), error => /no automatic retry/.test(error.message) && !error.message.includes('fixture-openai-key'));
  assert.equal(count, 1);
});

for (const [name, data, error] of [
  ['incomplete', { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output: [message()] }, /incomplete/],
  ['refusal', completed([{ type: 'message', content: [{ type: 'refusal', refusal: 'No' }] }]), /refused/],
  ['failed', { status: 'failed', error: { message: 'private' }, output: [] }, /failed/],
  ['schema mismatch', completed([message({ summary: 'missing fields' })]), /schema/],
  ['non-JSON final', completed([{ ...message(), content: [{ type: 'output_text', text: 'plain text' }] }]), /JSON/],
  ['unsupported output tool', completed([{ type: 'web_search_call' }]), /Unsupported/],
  ['no message', completed([{ type: 'reasoning', encrypted_content: 'opaque' }]), /no final/],
]) test(`${name} never produces publishable output`, async () => {
  const value = harness([data]);
  await assert.rejects(value.run(), error);
  assert.equal(value.requests.length, 1);
});

test('invalid JSON body and oversized HTTP response fail closed', async () => {
  await assert.rejects(harness([new Response('invalid')]).run(), /invalid JSON/);
  await assert.rejects(harness([new Response('x'.repeat(2001))], { budget: { ...BUDGET, responseBytes: 2000 } }).run(), /size limit/);
});

test('context budget is enforced before initial and subsequent paid requests', async () => {
  const initial = harness([], { budget: { ...BUDGET, contextBytes: 1 } });
  await assert.rejects(initial.run(), /context budget/); assert.equal(initial.requests.length, 0);
  const next = harness([completed([{ type: 'reasoning', encrypted_content: 'x'.repeat(10_000) }, call()])], { budget: { ...BUDGET, contextBytes: 8000 } });
  await assert.rejects(next.run(), /context budget/); assert.equal(next.requests.length, 1);
});

test('deadline expiration prevents additional requests', async () => {
  const times = [0, 0, BUDGET.deadlineMs + 1];
  const value = harness([completed([call()])], { now: () => times.shift() ?? BUDGET.deadlineMs + 1 });
  await assert.rejects(value.run(), /deadline exceeded/);
  assert.equal(value.requests.length, 1); assert.equal(value.invoked.length, 0);
});

test('missing key, invalid variables and budget reject before network', async () => {
  for (const overrides of [{ apiKey: '' }, { model: 'model with spaces' }, { effort: 'unsupported' }, { budget: { ...BUDGET, rounds: 7 } }]) {
    const value = harness([], overrides);
    await assert.rejects(value.run()); assert.equal(value.requests.length, 0);
  }
  const value = harness([completed([message()])], { model: 'another-model', effort: 'medium' });
  await value.run(); assert.equal(value.requests[0].body.model, 'another-model'); assert.equal(value.requests[0].body.reasoning.effort, 'medium');
});
