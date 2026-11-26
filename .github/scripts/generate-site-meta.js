#!/usr/bin/env node
// Builds site-meta.json from the repo's own git history:
//  - entries: for each AP, the date its block in ap_data.json was last edited (git blame)
//  - changes: the most recent merges into main (pull requests and branch merges), for changes.html
// Run from the repo root after merging: node .github/scripts/generate-site-meta.js
// Needs full history (a shallow clone gives wrong dates).
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const { apSlug } = require(path.join(root, 'ap-format.js'));

// 1. Per-line commit dates for ap_data.json
const porcelain = git('blame', '--line-porcelain', 'HEAD', '--', 'ap_data.json').split('\n');
const lineDates = [];
let time = null;
for (const line of porcelain) {
  if (line.startsWith('committer-time ')) time = Number(line.slice(15));
  else if (line.startsWith('\t')) lineDates.push(time);
}
const lines = fs.readFileSync(path.join(root, 'ap_data.json'), 'utf8').split('\n');
const data = JSON.parse(lines.join('\n'));
const entries = {};
let idx = -1, latest = 0;
lines.forEach((text, i) => {
  if (text === '  {') { idx += 1; latest = 0; }
  if (idx >= 0) latest = Math.max(latest, lineDates[i] || 0);
  if (text === '  }' || text === '  },') {
    const entry = data[idx];
    if (entry) entries[apSlug(entry)] = new Date(latest * 1000).toISOString().slice(0, 10);
  }
});

// 2. Recent merges into main: pull requests, and direct "Merge branch 'x': title" merges
const log = git('log', '--merges', '--first-parent', '-80', '--format=%cs%x1f%h%x1f%s%x1f%b%x1e');
const changes = [];
for (const rec of log.split('\x1e')) {
  const [date, sha, subject, body] = rec.trim().split('\x1f');
  if (!date || !subject) continue;
  const pr = (subject.match(/^Merge pull request #(\d+)/) || [])[1];
  const branch = subject.match(/^Merge branch '[^']+': (.+)$/);
  let title = '';
  if (pr) {
    const afterColon = subject.includes(': ') ? subject.split(': ').slice(1).join(': ') : '';
    title = (afterColon || (body || '').split('\n')[0] || '').trim();
  } else if (branch) {
    title = branch[1].trim();
  } else {
    continue;
  }
  if (title) changes.push(pr ? { date, pr: Number(pr), title } : { date, sha, title });
  if (changes.length >= 30) break;
}

const out = { generated: new Date().toISOString().slice(0, 10), entries, changes };
fs.writeFileSync(path.join(root, 'site-meta.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`site-meta.json: ${Object.keys(entries).length} entries, ${changes.length} changes`);
