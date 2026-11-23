#!/usr/bin/env node
'use strict';

const assert = require('assert');
const {
  safeReturnPath,
  buildApDetailHref,
  DETAIL_BACK_STORAGE_KEY,
  saveDetailBackPath,
  readDetailBackPath
} = require('../../ap-format.js');

assert.strictEqual(
  buildApDetailHref('cisco-c9130axi'),
  'ap.html?id=cisco-c9130axi',
  'detail href must be id-only'
);
assert.ok(
  !buildApDetailHref('x', 'index.html?v=Cisco').includes('return='),
  'extra args must not reintroduce return='
);

assert.strictEqual(safeReturnPath('index.html?v=Cisco&q=wifi'), 'index.html?v=Cisco&q=wifi');
assert.strictEqual(safeReturnPath('finder.html?wifi=6e'), 'finder.html?wifi=6e');
assert.strictEqual(safeReturnPath('https://evil.example/'), '');
assert.strictEqual(safeReturnPath('../index.html'), '');
assert.strictEqual(safeReturnPath('ap.html?id=x'), '');

const store = Object.create(null);
global.sessionStorage = {
  getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
  setItem(key, value) { store[key] = String(value); }
};

saveDetailBackPath('index.html?v=Aruba&cols=weight');
assert.strictEqual(store[DETAIL_BACK_STORAGE_KEY], 'index.html?v=Aruba&cols=weight');
assert.strictEqual(readDetailBackPath(), 'index.html?v=Aruba&cols=weight');

saveDetailBackPath('javascript:alert(1)');
assert.strictEqual(readDetailBackPath(), 'index.html?v=Aruba&cols=weight', 'reject unsafe writes');

console.log('OK: detail back helpers keep short URLs and validate session paths');
