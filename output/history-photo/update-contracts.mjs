import {readFile,writeFile} from 'node:fs/promises';
let s=await readFile('tests/history-preview.test.mjs','utf8');
s=s.replace('assert.match(doc.body.textContent, /肖像素材待定/);','assert.match(doc.body.textContent, /图灵真实肖像/);').replace('assert.match(doc.body.textContent, /非历史照片/);','assert.match(doc.body.textContent, /现代重建/);').replace('assert.match(doc.body.textContent, /非特定日期的真实航迹/);','assert.match(doc.body.textContent, /约1942年/);');
s=s.replace("test('five original local diagrams are labelled and trace hooks never gate text'", "test('photographic galleries replace the five original diagrams without gating text'");
const start=s.indexOf("  for (const name of ['intercept-relay'");const end=s.indexOf("  const css =",start);
s=s.slice(0,start)+`  assert.equal(doc.querySelectorAll('[data-diagram-source],svg').length, 0);\n  assert.equal(doc.querySelectorAll('[data-history-gallery]').length, 6);\n  for (const gallery of doc.querySelectorAll('[data-history-gallery]')) assert.ok(gallery.querySelectorAll('img').length >= 2);\n`+s.slice(end);
s=s.replace('assert.match(sources.textContent, /A2 \\/ 肖像素材待定/);','assert.match(sources.textContent, /A2 \\/ 图灵真实肖像/);');
await writeFile('tests/history-preview.test.mjs',s);
const m=JSON.parse(await readFile('assets/history/photos-manifest.json','utf8'));
const strip=s=>String(s||'原文件未提供机器可读署名').replace(/<[^>]*>/g,'').replaceAll('&amp;','&');
let md='\n\n## 真实影像替换 · 2026-10-17\n\n当前页面已撤下全部六组线绘图及图灵占位，改用真实影像。旧A2权利矛盾仅针对此前Elliott & Fry备选；当前采用独立的少年护照肖像。现代实物/场址不冒充战时现场。以下许可为Commons文件记录，原图保留未作内容改动，浏览器contain适配。\n\n';
let notices='\n\nHISTORY PHOTOGRAPHIC ARCHIVE — adopted 2026-10-17\n';
for(const r of m.filter(r=>r.local!=='bombe-rebuild.jpg')){
 const e=r.info.extmetadata;const line=`${r.local} | ${r.title} | ${strip(e.Artist?.value)} | ${e.LicenseShortName?.value} | ${r.info.descriptionurl} | ${e.LicenseUrl?.value||'Public-domain/CC0 record: see source page'}`;
 md+='- '+line+'\n';notices+=line+'\n';
}
await writeFile('docs/HISTORY_00_PHOTOS.md',md.trimStart());
await writeFile('docs/HISTORY_00_SOURCES.md',(await readFile('docs/HISTORY_00_SOURCES.md','utf8'))+md);
await writeFile('THIRD_PARTY_NOTICES.txt',(await readFile('THIRD_PARTY_NOTICES.txt','utf8'))+notices);
