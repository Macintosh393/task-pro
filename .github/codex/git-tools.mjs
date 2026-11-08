import { execFileSync } from 'node:child_process';

const SHA = /^[a-f0-9]{40}$/;
const ALIASES = ['head', 'base', 'trusted'];
const LIMITS = { entries: 10_000, blob: 128_000, output: 16_000, files: 60, searchBytes: 1_000_000, matches: 40 };

function exact(value, keys) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).sort().join(',') === [...keys].sort().join(',');
}

function validPath(value, empty = false) {
  return typeof value === 'string' && (empty && value === '' || value.length > 0 && value.length <= 500 &&
    !value.startsWith('/') && !/[\x00-\x1f\x7f\\]/.test(value) && !value.split('/').some(part => ['.', '..', ''].includes(part)));
}

function validPrefix(value) {
  return typeof value === 'string' && value.length <= 500 && !value.startsWith('/') &&
    validPath(value.endsWith('/') ? value.slice(0, -1) : value, true);
}

function integer(value, min, max) {
  return Number.isSafeInteger(value) && value >= min && value <= max;
}

function bounded(value) {
  if (Buffer.byteLength(JSON.stringify(value)) > LIMITS.output) throw new Error('Tool output exceeds 16 KB; narrow the request');
  return value;
}

export function createSourceTools({ directory, revisions }) {
  if (!exact(revisions, ALIASES) || !Object.values(revisions).every(value => SHA.test(value))) throw new Error('Invalid pinned revisions');
  const indexes = new Map();
  function git(...args) {
    return execFileSync('git', ['--no-optional-locks', '-c', 'core.hooksPath=/dev/null', ...args], {
      cwd: directory, encoding: 'buffer', maxBuffer: 2_000_000, timeout: 5000,
      env: { PATH: process.env.PATH, LANG: 'C.UTF-8', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null',
        GIT_TERMINAL_PROMPT: '0', GIT_LITERAL_PATHSPECS: '1', GIT_NO_REPLACE_OBJECTS: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }
  function index(alias) {
    if (!ALIASES.includes(alias)) throw new Error('Unknown revision alias');
    if (!indexes.has(alias)) {
      const entries = git('ls-tree', '-rz', '--full-tree', revisions[alias]).toString('utf8').split('\0').filter(Boolean);
      if (entries.length > LIMITS.entries) throw new Error('Source tree exceeds 10000 entries');
      const files = new Map();
      for (const entry of entries) {
        const match = /^(\d+) (\w+) ([a-f0-9]{40})\t([\s\S]+)$/.exec(entry);
        if (!match) throw new Error('Invalid Git tree entry');
        files.set(match[4], { mode: match[1], type: match[2], oid: match[3] });
      }
      indexes.set(alias, files);
    }
    return indexes.get(alias);
  }
  function text(alias, path) {
    if (!validPath(path)) throw new Error('Invalid repository-relative path');
    const entry = index(alias).get(path);
    if (!entry) throw new Error('Path does not exist at this revision');
    if (!['100644', '100755'].includes(entry.mode) || entry.type !== 'blob') throw new Error('Only regular text blobs are supported');
    const size = Number(git('cat-file', '-s', entry.oid).toString());
    if (!Number.isSafeInteger(size) || size > LIMITS.blob) throw new Error('Text blob exceeds 128 KB');
    const buffer = git('cat-file', 'blob', entry.oid);
    if (buffer.includes(0)) throw new Error('Binary blob is not readable');
    let value;
    try { value = new TextDecoder('utf-8', { fatal: true }).decode(buffer); }
    catch { throw new Error('Blob is not UTF-8 text'); }
    return { value, size };
  }
  function invoke(name, args) {
    if (name === 'read_source') {
      if (!exact(args, ['revision', 'path', 'start_line', 'end_line']) ||
          !integer(args.start_line, 1, 1_000_000) || !integer(args.end_line, args.start_line, args.start_line + 199)) throw new Error('Invalid read_source arguments');
      const lines = text(args.revision, args.path).value.split('\n');
      if (args.start_line > lines.length) throw new Error('Requested line is outside the blob');
      return bounded({ revision: args.revision, path: args.path, total_lines: lines.length,
        lines: lines.slice(args.start_line - 1, args.end_line).map((value, offset) => ({ line: args.start_line + offset, text: value })) });
    }
    if (name === 'list_source') {
      if (!exact(args, ['revision', 'prefix', 'offset', 'limit']) || !validPrefix(args.prefix) ||
          !integer(args.offset, 0, LIMITS.entries) || !integer(args.limit, 1, 100)) throw new Error('Invalid list_source arguments');
      const paths = [...index(args.revision).keys()].filter(path => path.startsWith(args.prefix)).sort();
      return bounded({ total: paths.length, paths: paths.slice(args.offset, args.offset + args.limit),
        next_offset: args.offset + args.limit < paths.length ? args.offset + args.limit : null });
    }
    if (name === 'search_source') {
      if (!exact(args, ['revision', 'prefix', 'query']) || !validPrefix(args.prefix) ||
          typeof args.query !== 'string' || !args.query || args.query.length > 120 || /[\x00-\x1f\x7f]/.test(args.query)) throw new Error('Invalid search_source arguments');
      const files = [...index(args.revision)].filter(([path, entry]) => path.startsWith(args.prefix) &&
        ['100644', '100755'].includes(entry.mode) && entry.type === 'blob');
      if (files.length > LIMITS.files) throw new Error('Search matches more than 60 files; narrow the prefix');
      const matches = [];
      const skipped = [];
      let bytes = 0;
      for (const [path] of files) {
        let source;
        try { source = text(args.revision, path); }
        catch (error) {
          if (!/^(Text blob|Binary blob|Blob)/.test(error.message)) throw error;
          skipped.push({ path, reason: error.message }); continue;
        }
        bytes += source.size;
        if (bytes > LIMITS.searchBytes) throw new Error('Search exceeds 1 MB; narrow the prefix');
        for (const [offset, line] of source.value.split('\n').entries()) {
          if (line.includes(args.query)) {
            if (matches.length >= LIMITS.matches) return bounded({ matches, skipped, truncated: true });
            matches.push({ path, line: offset + 1, text: line.slice(0, 500), text_truncated: line.length > 500 });
          }
        }
      }
      return bounded({ matches, skipped, truncated: false });
    }
    throw new Error('Unknown source tool');
  }
  return {
    initialDocuments() {
      const documents = ['AGENTS.md', 'README.md', 'TECH.md', 'CONTRIBUTING.md'].filter(path => index('trusted').has(path))
        .map(path => ({ path, content: text('trusted', path).value }));
      if (Buffer.byteLength(JSON.stringify(documents)) > 64_000) throw new Error('Trusted root documents exceed 64 KB');
      return documents;
    },
    invoke(name, raw) {
      try {
        if (typeof raw !== 'string' || Buffer.byteLength(raw) > 2000) throw new Error('Tool arguments exceed 2 KB');
        return JSON.stringify(invoke(name, JSON.parse(raw)));
      } catch (error) {
        const message = error instanceof SyntaxError ? 'Invalid JSON tool arguments' :
          /^(Invalid|Unknown|Only|Path|Text blob|Binary blob|Blob|Tool output|Requested|Source tree|Search)/.test(error.message) ? error.message : 'Source lookup failed';
        return JSON.stringify({ error: message });
      }
    },
  };
}

const revision = { type: 'string', enum: ALIASES };
const prefix = { type: 'string', maxLength: 500 };
const tool = (name, description, properties) => ({ type: 'function', name, description, strict: true,
  parameters: { type: 'object', properties, required: Object.keys(properties), additionalProperties: false } });

export const SOURCE_TOOLS = [
  tool('read_source', 'Читай нумеровані рядки звичайного UTF-8 Git blob. head=PR head, base=merge-base, trusted=default branch. Без symlink/binary, до 200 рядків і 16 KB.', {
    revision, path: { type: 'string', minLength: 1, maxLength: 500 },
    start_line: { type: 'integer', minimum: 1, maximum: 1_000_000 }, end_line: { type: 'integer', minimum: 1, maximum: 1_000_199 },
  }),
  tool('list_source', 'Перелік tracked шляхів за pinned revision. Порожній prefix означає всі шляхи. Лише буквальний prefix, без glob/shell. Результат із pagination.', {
    revision, prefix, offset: { type: 'integer', minimum: 0, maximum: LIMITS.entries }, limit: { type: 'integer', minimum: 1, maximum: 100 },
  }),
  tool('search_source', 'Буквальний пошук із врахуванням регістру у максимум 60 regular text blobs за prefix. При перевищенні ліміту звузь prefix. Пропуски й обрізання явно позначені.', {
    revision, prefix, query: { type: 'string', minLength: 1, maxLength: 120 },
  }),
];
