import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {Window} from 'happy-dom';
test('every historical drawing is replaced by sourced local photography and accessible galleries',async()=>{
 const w=new Window();w.document.write(await readFile('history-preview.html','utf8'));const d=w.document;
 assert.equal(d.querySelectorAll('svg,[data-diagram-source],.portrait-placeholder,.name-study').length,0);
 assert.ok(d.querySelector('#turing img[src$="turing-1928.jpg"]'));
 for(const id of ['intercept','victory']){
  const gallery=d.querySelector(`#${id} [data-history-gallery]`);assert.ok(gallery,id);
  assert.ok(gallery.querySelectorAll('[data-gallery-slide]').length>=2,id);
  for(const slide of gallery.querySelectorAll('[data-gallery-slide]')){
   assert.equal(slide.hidden,false);assert.ok(slide.querySelector('figcaption a[href^="https://"]'));
   const img=slide.querySelector('img');assert.ok(img.alt.length>8);assert.ok((await stat(img.getAttribute('src'))).size>1000);
  }
  for(const suffix of ['prev','next','toggle','count'])assert.ok(gallery.querySelector(`[data-gallery-${suffix}]`));
 }
 assert.doesNotMatch(d.body.textContent,/肖像素材待定|真实肖像仍待核实/);
 await w.happyDOM.close();
});
