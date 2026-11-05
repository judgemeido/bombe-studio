import test from 'node:test';
import assert from 'node:assert/strict';
import {ALPHABET,ROTORS,traceLetter,pressKey,internalPoints,wiringContact,segmentPaths,contact,tourState} from '../chapters/bench/kinematics.js';
const near=(a,b)=>a.forEach((n,i)=>assert.ok(Math.abs(n-b[i])<1e-9,`${a} != ${b}`));
test('every displayed rotor wire is the same permutation as the cipher, at every position',()=>{
  for(let i=0;i<3;i++)for(let p=0;p<26;p++)for(let n=0;n<26;n++){
    const positions=[0,0,0];positions[i]=p;const {input,output}=wiringContact(i,n,positions,.65);
    near(input,contact(i,(n-p+26)%26,1,.65));near(output,contact(i,(ALPHABET.indexOf(ROTORS[i].wiring[n])-p+26)%26,-1,.65));
    const controls=internalPoints(input,output);near(controls[0],input);near(controls.at(-1),output);
  }
});
test('all nine traced paths join the cipher stage contacts and reverse the same internal wires',()=>{
  for(const pos of [[0,0,0],[0,3,21],[0,4,22],[4,13,25]])for(const input of ALPHABET){
    const trace=pressKey(input,pos,[['A','Z']]);
    for(let i=0;i<9;i++){
      const s=trace.stages[i],paths=segmentPaths(trace,i,.75);near(paths[0].at(-1),paths[1][0]);
      if(s.rotor!==null){const start=contact(s.rotor,s.input,s.reverse?-1:1,.75),end=contact(s.rotor,s.output,s.reverse?1:-1,.75);near(paths[1][0],start);near(paths[1].at(-1),end);assert.deepEqual(paths[1],internalPoints(start,end));}
    }
    assert.equal(traceLetter(trace.output,trace.positions,[['A','Z']]).output,input);
  }
});
test('known vector and arbitrary-time tour states are reproducible',()=>{
  let pos=[0,0,0],out='';for(let i=0;i<5;i++){const t=pressKey('A',pos,[]);out+=t.output;pos=t.positions;}assert.equal(out,'BDZGO');
  const frames=[0,7.3,14.3,23.3,31.3,40.3].map(t=>tourState(t));tourState(48);assert.deepEqual(frames,[0,7.3,14.3,23.3,31.3,40.3].map(t=>tourState(t)));
});


test('tour ends with a real reciprocal path at the same wheel positions',()=>{
 const forward=tourState(37.5),back=tourState(46.5);assert.equal(forward.progress,9);assert.equal(back.progress,9);assert.equal(back.trace.input,forward.trace.output);assert.equal(back.trace.output,forward.trace.input);assert.deepEqual(back.positions,forward.positions);
});
