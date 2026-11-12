const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const queryString = require('query-string');

test('patched URL decoder preserves Expo Router query-string API', () => {
  assert.deepEqual({ ...queryString.parse('search=hello%20world&tag=a&tag=b') }, { search: 'hello world', tag: ['a', 'b'] });
  assert.equal(queryString.stringify({ search: 'hello world', tag: ['a', 'b'] }), 'search=hello%20world&tag=a&tag=b');
  assert.equal(queryString.stringify({ id: '42', title: '🔐' }), 'id=42&title=%F0%9F%94%90');
});

test('malformed percent encoding cannot stall route parsing', () => {
  execFileSync(process.execPath, ['-e', "require('query-string').parse('q=' + '%A'.repeat(25000))"], { cwd: process.cwd(), timeout: 3000 });
});
