#!/usr/bin/env node
// CC Env Docs — Content Sync Script
// Syncs ~/.claude/{rules,skills,agents} into src/content/
// Usage: node scripts/sync-content.mjs [--dry]

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, basename, resolve } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';

const DRY = process.argv.includes('--dry');
const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const CONTENT_DIR = join(PROJECT_ROOT, 'src', 'content');
const HOME = homedir();
const CLAUDE_DIR = join(HOME, '.claude');

// ── Config (edit these to customize) ─────────────────────────

// Skills to exclude from sync (e.g. external skill packs)
const SKILL_EXCLUDES = new Set([
  // 'some-external-skill',
]);

// MCP servers to exclude from infra page
const MCP_EXCLUDES = new Set([
  // 'claude_ai_SomeService',
]);

// Icon overrides: slug → icon name
// Available: shield, zap, wrench, terminal, clock, plug, scan,
//   receipt, users, megaphone, book-open, message-circle, table, bot, target, building
const ICON_MAP = {
  // 'my-rule': 'shield',
};

// MCP server descriptions (auto-detected servers get these labels)
const MCP_DESCRIPTIONS = {
  // 'chatwork': 'Chatwork API',
};

// ── Helpers ───────────────────────────────────────────────────
function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function extractDescription(content) {
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (t && !t.startsWith('#') && !t.startsWith('---') && !t.startsWith('```') && !t.startsWith('|') && !t.startsWith('-')) {
      return t.slice(0, 120);
    }
  }
  return '';
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  let key = '', val = '';
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (kv) {
      if (key) fm[key] = val.trim().replace(/^["']|["']$/g, '');
      key = kv[1];
      val = (kv[2] === '|' || kv[2] === '>') ? '' : kv[2];
    } else if (key && (line.startsWith('  ') || line.startsWith('\t'))) {
      val += ' ' + line.trim();
    }
  }
  if (key) fm[key] = val.trim().replace(/^["']|["']$/g, '');
  if (fm.description === '|' || fm.description === '>') fm.description = '';
  return fm;
}

function bodyAfterFrontmatter(content) {
  const match = content.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)/);
  return match ? match[1].trim() : content;
}

function gitDates(contentPath) {
  try {
    const run = (cmd) => execSync(cmd, { cwd: PROJECT_ROOT, encoding: 'utf-8' }).trim().slice(0, 10);
    return {
      created: run(`git log --diff-filter=A --format=%ai -- "${contentPath}"`) || '',
      updated: run(`git log -1 --format=%ai -- "${contentPath}"`) || '',
    };
  } catch { return { created: '', updated: '' }; }
}

function write(filepath, content) {
  const dir = join(filepath, '..');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (DRY) { console.log(`  [DRY] ${filepath}`); return; }
  if (existsSync(filepath) && readFileSync(filepath, 'utf-8') === content) return;
  writeFileSync(filepath, content, 'utf-8');
}

function icon(slug, fallback) { return ICON_MAP[slug] || fallback; }

function esc(s) { return s.replace(/"/g, '\\"'); }

// ── Sync Functions ───────────────────────────────────────────

function syncRules() {
  const dir = join(CLAUDE_DIR, 'rules');
  if (!existsSync(dir)) { console.log('  Rules: ~/.claude/rules/ not found'); return; }
  const outDir = join(CONTENT_DIR, 'rules');
  mkdirSync(outDir, { recursive: true });
  const files = readdirSync(dir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const slug = basename(file, '.md');
    const raw = readFileSync(join(dir, file), 'utf-8');
    const title = extractTitle(raw) || slug;
    const body = raw.replace(/^#\s+.+\n*/, '');
    const dates = gitDates(join('src/content/rules', `${slug}.md`));
    write(join(outDir, `${slug}.md`), `---
title: "${esc(title)}"
description: "${esc(extractDescription(body))}"
order: ${files.indexOf(file)}
icon: ${icon(slug, 'book-open')}
created: "${dates.created}"
updated: "${dates.updated}"
---

${body.trim()}
`);
  }
  console.log(`  Rules: ${files.length} files`);
}

function syncAgents() {
  const dir = join(CLAUDE_DIR, 'agents');
  if (!existsSync(dir)) { console.log('  Agents: ~/.claude/agents/ not found'); return; }
  const outDir = join(CONTENT_DIR, 'agents');
  mkdirSync(outDir, { recursive: true });
  const files = readdirSync(dir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const slug = basename(file, '.md');
    const raw = readFileSync(join(dir, file), 'utf-8');
    const fm = parseFrontmatter(raw);
    const body = bodyAfterFrontmatter(raw).replace(/^#\s+.+\n*/, '');
    const title = fm.name || extractTitle(bodyAfterFrontmatter(raw)) || slug;
    const desc = fm.description || extractDescription(body);
    const tools = fm.tools || '';
    let content = body.trim();
    if (!content) {
      content = desc;
      if (tools) content += '\n\n## Tools\n\n' + tools.split(',').map(t => `- \`${t.trim()}\``).join('\n');
    }
    const dates = gitDates(join('src/content/agents', `${slug}.md`));
    write(join(outDir, `${slug}.md`), `---
title: "${esc(title)}"
description: "${esc(desc)}"
${fm.model ? `model: "${fm.model}"` : ''}
${tools ? `tools: "${esc(tools)}"` : ''}
order: ${files.indexOf(file)}
icon: bot
created: "${dates.created}"
updated: "${dates.updated}"
---

${content}
`);
  }
  console.log(`  Agents: ${files.length} files`);
}

function syncSkills() {
  const dir = join(CLAUDE_DIR, 'skills');
  if (!existsSync(dir)) { console.log('  Skills: ~/.claude/skills/ not found'); return; }
  const outDir = join(CONTENT_DIR, 'skills');
  mkdirSync(outDir, { recursive: true });
  const entries = readdirSync(dir).filter(e => {
    const p = join(dir, e);
    return statSync(p).isDirectory() && existsSync(join(p, 'SKILL.md')) && !SKILL_EXCLUDES.has(e);
  });
  for (const name of entries) {
    const raw = readFileSync(join(dir, name, 'SKILL.md'), 'utf-8');
    const fm = parseFrontmatter(raw);
    const body = bodyAfterFrontmatter(raw);
    const title = extractTitle(body) || fm.name || name;
    const desc = fm.description || extractDescription(body);
    const triggerMatch = desc.match(/TRIGGER\s+when:\s*(.+?)(?:\.|$)/i);
    const trigger = triggerMatch ? triggerMatch[1].trim() : '';
    const cleanDesc = desc.replace(/\s*TRIGGER\s+when:.*/i, '').replace(/\s*-\s*When\s+.*/i, '').trim().slice(0, 120);
    const content = body.replace(/^#\s+.+\n*/, '');
    const dates = gitDates(join('src/content/skills', `${name}.md`));
    write(join(outDir, `${name}.md`), `---
title: "${esc(title)}"
description: "${esc(cleanDesc)}"
${trigger ? `trigger: "${esc(trigger)}"` : ''}
order: ${entries.indexOf(name)}
icon: ${icon(name, 'zap')}
created: "${dates.created}"
updated: "${dates.updated}"
---

${content.trim()}
`);
  }
  console.log(`  Skills: ${entries.length} files`);
}

function syncInfra() {
  const outDir = join(CONTENT_DIR, 'infra');
  mkdirSync(outDir, { recursive: true });

  // MCP Servers — auto-detect from session history
  const sessionDir = join(CLAUDE_DIR, 'usage-data', 'session-meta');
  const detected = new Set();
  if (existsSync(sessionDir)) {
    const files = readdirSync(sessionDir).filter(f => f.endsWith('.json'))
      .map(f => ({ f, t: statSync(join(sessionDir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t).slice(0, 100);
    for (const { f } of files) {
      try {
        const d = JSON.parse(readFileSync(join(sessionDir, f), 'utf-8'));
        for (const t of Object.keys(d.tool_counts || {})) {
          const m = t.match(/^mcp__([\w-]+)__/);
          if (m) detected.add(m[1]);
        }
      } catch {}
    }
  }
  MCP_EXCLUDES.forEach(s => detected.delete(s));
  const local = [...detected].filter(s => !s.startsWith('claude_ai_')).sort();
  const cloud = [...detected].filter(s => s.startsWith('claude_ai_')).sort();

  let mcp = `---\ntitle: MCP サーバー一覧\ndescription: セッション履歴から自動検出された MCP サーバー\norder: 1\nicon: plug\n---\n\n`;
  mcp += `## ローカル MCP\n\n| サーバー | 用途 |\n|---|---|\n`;
  if (local.length) local.forEach(s => { mcp += `| \`${s}\` | ${MCP_DESCRIPTIONS[s] || ''} |\n`; });
  else mcp += '| （未検出） | |\n';
  if (cloud.length) {
    mcp += `\n## claude.ai MCP\n\n| サーバー | 用途 |\n|---|---|\n`;
    cloud.forEach(s => { mcp += `| **${s.replace('claude_ai_', '').replace(/_/g, ' ')}** | ${MCP_DESCRIPTIONS[s] || ''} |\n`; });
  }
  write(join(outDir, 'mcp-servers.md'), mcp);

  // Pipelines — macOS LaunchAgents
  const launchDir = join(HOME, 'Library', 'LaunchAgents');
  let pipe = `---\ntitle: 自動化パイプライン\ndescription: launchd ジョブの一覧\norder: 2\nicon: clock\n---\n\n`;
  if (existsSync(launchDir)) {
    const plists = readdirSync(launchDir).filter(f => f.match(/^com\.\w+\..+\.plist$/));
    if (plists.length) {
      pipe += '| ジョブ | スケジュール |\n|---|---|\n';
      for (const f of plists) {
        try {
          const raw = readFileSync(join(launchDir, f), 'utf-8');
          const label = (raw.match(/<key>Label<\/key>\s*<string>([^<]+)/) || [])[1] || f;
          const hour = (raw.match(/<key>Hour<\/key>\s*<integer>(\d+)/) || [])[1];
          const min = (raw.match(/<key>Minute<\/key>\s*<integer>(\d+)/) || [])[1];
          const sched = hour ? `${hour.padStart(2,'0')}:${(min||'0').padStart(2,'0')}` : '—';
          pipe += `| \`${label}\` | ${sched} |\n`;
        } catch {}
      }
    } else pipe += 'launchd ジョブは検出されませんでした。\n';
  } else pipe += 'LaunchAgents ディレクトリが見つかりません。\n';
  write(join(outDir, 'pipelines.md'), pipe);

  // CLI Tools — placeholder
  write(join(outDir, 'cli-tools.md'), `---\ntitle: CLI ツール群\ndescription: 開発環境の CLI ツール\norder: 3\nicon: terminal\n---\n\n| ツール | 説明 |\n|---|---|\n| \`claude\` | Claude Code CLI |\n`);

  console.log('  Infra: 3 files');
}

// ── Main ─────────────────────────────────────────────────────
function main() {
  console.log(`CC Env Docs — Sync${DRY ? ' (DRY)' : ''}`);
  console.log(`  ${CLAUDE_DIR} → ${CONTENT_DIR}`);
  console.log('─'.repeat(40));
  syncRules();
  syncAgents();
  syncSkills();
  syncInfra();
  console.log('─'.repeat(40));
  console.log(DRY ? 'Dry run complete.' : 'Done. Run `pnpm build` to rebuild.');
}

main();
