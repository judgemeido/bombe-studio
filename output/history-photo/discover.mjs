const titles=['Alan Turing','Marian Rejewski','Jerzy Różycki','Henryk Zygalski','Bombe','Bletchley Park','Y service','Battle of the Atlantic','Lorenz cipher','Colossus computer'];
const out=[];
for(const title of titles){const u=new URL('https://en.wikipedia.org/w/api.php');u.search=new URLSearchParams({action:'query',titles:title,prop:'images|pageimages',imlimit:'30',pithumbsize:'1200',format:'json'});const data=await(await fetch(u)).json();out.push({title,data});}
await (await import('node:fs/promises')).writeFile('output/history-photo/discovery.json',JSON.stringify(out,null,2));
for(const x of out){const p=Object.values(x.data.query.pages)[0];console.log(x.title,JSON.stringify({thumb:p.thumbnail,images:p.images?.map(i=>i.title)}));}
