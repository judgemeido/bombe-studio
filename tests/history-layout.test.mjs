import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const css=await readFile(new URL('../history-preview.css',import.meta.url),'utf8');
test('mobile history index is a contained single-row scroller rather than a tall grid',()=>{
 assert.match(css,/\.chapter-nav ol\s*\{[^}]*flex-wrap:\s*nowrap[^}]*overflow-x:\s*auto/s);
 assert.match(css,/\.chapter-nav li\s*\{[^}]*flex:\s*0 0 auto/s);
});
test('editorial headings balance Chinese line endings and responsive header has explicit tracks',()=>{
 assert.match(css,/\.scene-heading h2\s*\{[^}]*text-wrap:\s*balance/s);
 assert.match(css,/\.masthead\s*\{[^}]*grid-template-columns:\s*1fr auto/s);
});
test('history stylesheet still compiles without warnings',async()=>{
 const result=await transform(css,{loader:'css'});assert.deepEqual(result.warnings,[]);
});
