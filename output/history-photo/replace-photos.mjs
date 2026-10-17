import {readFile,writeFile} from 'node:fs/promises';
const manifest=JSON.parse(await readFile('assets/history/photos-manifest.json','utf8'));
const photos=Object.fromEntries(manifest.map(r=>[r.local,r]));
const captions={
 'turing-1928.jpg':'艾伦·图灵约16岁时的护照照片，约1928—1929年；并非战时工作照。',
 'rejewski-1932.jpg':'马里安·雷耶夫斯基，约1932年。摄影者不详；Commons标注CC BY-SA 2.5。',
 'rozycki.jpg':'耶日·鲁日茨基，档案肖像，约1930—1940年代；摄影者不详。',
 'zygalski.jpg':'亨里克·齐加尔斯基，1930年代肖像；摄影者不详。',
 'bombe-wartime.jpg':'布莱切利园的Bombe，战时照片；文件记录标注1945年，摄影者不详。',
 'bombe-drums.jpg':'现代重建Bombe的鼓轮与安装板，2011年4月10日；TedColes摄，CC0。',
 'bletchley-mansion.jpg':'布莱切利园主楼，2017年3月4日；DeFacto摄，CC BY-SA 4.0。现代场址照片，不是战时现场。',
 'hut6.jpg':'布莱切利园6号木屋的现代场址照片；文件于2005年上传，确切拍摄日期未注明。',
 'arkley-1943.jpg':'Arkley View无线电监听机构，影像标注1943年；Aka2112提供的档案扫描，CC BY-SA 3.0。2013年为数字文件日期。',
 'hro-receiver.png':'National HRO短波接收机的实物照片，2006年；LuckyLouie摄，CC BY-SA 3.0。不是战时操作现场。',
 'convoy-1942.jpg':'冰岛附近大西洋上的盟军护航船队，约1942年；美国海军照片80-G-72409。',
 'bombe-rebuild.jpg':'现代重建Bombe实物照片；非战时机器现场。作者署名及许可详见原文件页，CC BY-SA 3.0。'
};
function slide(file){const p=photos[file];return `<figure data-gallery-slide><img src="assets/history/${file}" loading="lazy" decoding="async" alt="${captions[file]}"><figcaption>${captions[file]} <a href="${p.info.descriptionurl}" target="_blank" rel="noopener noreferrer">影像来源 ↗</a></figcaption></figure>`;}
function gallery(files,label,classes=''){return `<div class="history-gallery ${classes}" data-history-gallery role="region" aria-label="${label}"><div class="gallery-slides">${files.map(slide).join('\n')}</div><div class="gallery-controls" hidden><span class="gallery-label">${label}</span><button type="button" data-gallery-prev aria-label="上一张影像">←</button><output data-gallery-count aria-live="off">01 / ${String(files.length).padStart(2,'0')}</output><button type="button" data-gallery-next aria-label="下一张影像">→</button><button type="button" data-gallery-toggle>暂停轮播</button></div></div>`;}
let html=await readFile('history-preview.html','utf8');
html=html.replace(/<aside class="ocean-note"[\s\S]*?<\/aside>/,gallery(['convoy-1942.jpg','arkley-1943.jpg'],'战争与通信档案','ocean-note'));
const groups={
 'intercept-relay':[['arkley-1943.jpg','hro-receiver.png'],'截收机构与设备'],
 'pioneers-relay':[['rejewski-1932.jpg','rozycki.jpg','zygalski.jpg'],'波兰三位密码学家'],
 'constraint-loop':[['bombe-wartime.jpg','bombe-drums.jpg'],'从战时Bombe到重建细节'],
 'intelligence-chain':[['bletchley-mansion.jpg','hut6.jpg'],'布莱切利园场址'],
 'bombe-outline':[['bombe-wartime.jpg','bombe-drums.jpg'],'Bombe实物档案']
};
for(const [name,[files,label]] of Object.entries(groups))html=html.replace(new RegExp(`<figure class="story-diagram ${name}"[\\s\\S]*?<\\/figure>`),gallery(files,label,'archive-gallery'));
html=html.replace(/<figure class="portrait-placeholder"[\s\S]*?<\/figure>/,`<figure class="turing-portrait">${slide('turing-1928.jpg').replace('<figure data-gallery-slide>','').replace('</figure>','')}</figure>`);
html=html.replace('七幕档案串起通信、破译与协作的战时脉络；真实肖像仍待核实。','七幕档案串起通信、破译与协作的战时脉络。档案影像、现代实物和场址照片均分别标注。');
html=html.replace(/<li><strong>A2 \/ 肖像素材待定[\s\S]*?<\/li>/,`<li><strong>A2 / 图灵真实肖像</strong> 约1928—1929年的护照照片，约16岁。Commons文件记录标注公共领域；不是此前未采用的Elliott &amp; Fry肖像。<a href="${photos['turing-1928.jpg'].info.descriptionurl}">原文件与来源</a>。</li>`);
html=html.replace(/<li><strong>A4–A9 \/ 原创图解[\s\S]*?<\/li>/,`<li><strong>A4–A15 / 真实影像档案</strong> 原线绘图已替换为档案与实物照片。各张来源、摄影者与许可见图注；完整记录见项目影像清单。S2：<a href="https://www.tnmoc.org/bombe">The National Museum of Computing / Bombe</a>；S3：<a href="https://mathshistory.st-andrews.ac.uk/Biographies/Turing/">MacTutor / Alan Turing</a>。</li>`);
html=html.replace('本页包含经过简化的教学示意。历史图片的拍摄时间、现代重建图像与原理示意均分别标注；','本页使用真实影像资料。战时照片、人物肖像与现代实物及场址照片均分别标注；');
await writeFile('history-preview.html',html);
