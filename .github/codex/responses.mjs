import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createSourceTools, SOURCE_TOOLS } from './git-tools.mjs';
import { validateResult } from './review.mjs';

export const BUDGET = Object.freeze({ rounds: 6, toolCalls: 30, outputTokens: 8000, contextBytes: 700_000,
  responseBytes: 2_000_000, deadlineMs: 600_000, requestMs: 120_000 });

async function responseJson(response, limit) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('OpenAI response body is missing');
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) throw new Error('OpenAI response exceeds size limit');
      chunks.push(Buffer.from(value));
    }
  } finally { await reader.cancel(); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('OpenAI returned invalid JSON'); }
}

export async function runReview({ apiKey, prompt, schema, input, sourceTools, model = 'gpt-6.1-sol', effort = 'high',
  fetcher = fetch, now = Date.now, onUsage = () => {}, budget = BUDGET }) {
  if (typeof apiKey !== 'string' || !apiKey.trim()) throw new Error('Налаштуйте repository Actions secret OPENAI_API_KEY');
  if (typeof model !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/.test(model) ||
      !['low', 'medium', 'high', 'xhigh', 'max'].includes(effort)) throw new Error('Invalid review model or effort');
  for (const key of Object.keys(BUDGET)) {
    if (!Number.isSafeInteger(budget[key]) || budget[key] < 1 || budget[key] > BUDGET[key]) throw new Error('Invalid review budget');
  }
  const started = now();
  const history = [{ role: 'user', content: [{ type: 'input_text', text: input }] }];
  const usage = { requests: 0, tool_calls: 0, input_tokens: 0, output_tokens: 0, usage_responses: 0 };
  const callIds = new Set();
  function remaining() {
    const value = budget.deadlineMs - (now() - started);
    if (value <= 0) throw new Error('Review deadline exceeded');
    return value;
  }
  try {
    for (let round = 0; round < budget.rounds; round++) {
      const final = round === budget.rounds - 1 || usage.tool_calls >= budget.toolCalls;
      const body = {
        model, reasoning: { effort }, instructions: final ? `${prompt}\n\nЛіміт дослідження досягнуто: tools вимкнено. Поверни фінальний JSON за вже прочитаним контекстом, у not_verified зазнач межу source-перевірки.` : prompt, input: history, store: false,
        include: ['reasoning.encrypted_content'], max_output_tokens: budget.outputTokens,
        tools: SOURCE_TOOLS, tool_choice: final ? 'none' : 'auto', parallel_tool_calls: true,
        text: { format: { type: 'json_schema', name: 'pull_request_review', strict: true, schema } },
      };
      if (Buffer.byteLength(JSON.stringify(body)) > budget.contextBytes) throw new Error('Review context budget exceeded');
      const timeout = Math.min(remaining(), budget.requestMs);
      usage.requests++;
      let response;
      try {
        response = await fetcher('https://api.openai.com/v1/responses', {
          method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body), signal: AbortSignal.timeout(timeout), redirect: 'error',
        });
      } catch { throw new Error('OpenAI request failed or timed out; no automatic retry'); }
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error(`OpenAI HTTP ${response.status}; no automatic retry`);
      }
      const data = await responseJson(response, budget.responseBytes);
      if (Number.isSafeInteger(data.usage?.input_tokens) && data.usage.input_tokens >= 0 &&
          Number.isSafeInteger(data.usage?.output_tokens) && data.usage.output_tokens >= 0) {
        usage.input_tokens += data.usage.input_tokens;
        usage.output_tokens += data.usage.output_tokens;
        usage.usage_responses++;
      }
      remaining();
      if (data.status !== 'completed' || data.error) throw new Error('OpenAI response incomplete or failed; nothing will be published');
      if (!Array.isArray(data.output) || data.output.length > 100) throw new Error('Invalid OpenAI output items');
      const messages = data.output.filter(item => item.type === 'message');
      if (messages.some(message => !Array.isArray(message.content) || message.content.some(item => item.type === 'refusal'))) throw new Error('OpenAI refused the review; nothing will be published');
      if (data.output.some(item => !['message', 'reasoning', 'function_call'].includes(item.type))) throw new Error('Unsupported OpenAI output item');
      const calls = data.output.filter(item => item.type === 'function_call');
      if (calls.length) {
        if (final) throw new Error('Tool calls returned during final review round');
        if (usage.tool_calls + calls.length > budget.toolCalls) throw new Error('Review tool call budget exceeded');
        history.push(...data.output);
        for (const call of calls) {
          remaining();
          if (typeof call.call_id !== 'string' || !call.call_id || call.call_id.length > 200 || callIds.has(call.call_id)) throw new Error('Invalid or repeated tool call ID');
          callIds.add(call.call_id);
          usage.tool_calls++;
          const output = sourceTools.invoke(call.name, call.arguments);
          if (typeof output !== 'string' || Buffer.byteLength(output) > 16_000) throw new Error('Invalid bounded tool output');
          history.push({ type: 'function_call_output', call_id: call.call_id, output });
        }
        continue;
      }
      const explicit = messages.filter(message => message.phase === 'final_answer');
      const terminal = explicit.length ? explicit : messages.some(message => message.phase !== undefined) ? [] : messages;
      if (terminal.length !== 1 || terminal[0].role !== 'assistant' ||
          terminal[0].content.length !== 1 || terminal[0].content[0].type !== 'output_text' ||
          typeof terminal[0].content[0].text !== 'string') throw new Error('OpenAI returned no final structured review');
      const result = validateResult(terminal[0].content[0].text);
      if (final) {
        const limitation = 'Досягнуто ліміт дослідження source; фінальний round виконувався без tools.';
        if (result.not_verified.length < 8) result.not_verified.push(limitation);
        else if (result.not_verified[7].length + limitation.length + 1 <= 500) result.not_verified[7] += ` ${limitation}`;
        else if (result.summary.length + limitation.length + 1 <= 2000) result.summary += `\n${limitation}`;
        else throw new Error('Final review cannot include mandatory limitations within schema budget');
      }
      return result;
    }
    throw new Error('Review round budget exhausted without a final result');
  } finally { onUsage(usage); }
}

async function main() {
  const context = JSON.parse(readFileSync('.review-data/context.json', 'utf8'));
  const sourceTools = createSourceTools({ directory: resolve('.'), revisions: {
    head: context.head, base: context.merge_base, trusted: context.trusted,
  } });
  const input = JSON.stringify({ context, diff: readFileSync('.review-data/diff.patch', 'utf8'), trusted_documents: sourceTools.initialDocuments() });
  const result = await runReview({ apiKey: process.env.OPENAI_API_KEY,
    model: process.env.CODEX_REVIEW_MODEL || 'gpt-6.1-sol', effort: process.env.CODEX_REVIEW_EFFORT || 'high',
    prompt: readFileSync('.github/codex/prompt.md', 'utf8'), schema: JSON.parse(readFileSync('.github/codex/schema.json', 'utf8')),
    input, sourceTools, onUsage: usage => console.log(JSON.stringify({ openai_review_usage: usage })),
  });
  const raw = JSON.stringify(result);
  appendFileSync(process.env.GITHUB_OUTPUT, `result<<openai_review_result\n${raw}\nopenai_review_result\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
