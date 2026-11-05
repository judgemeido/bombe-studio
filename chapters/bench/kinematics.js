import {ALPHABET,ROTORS,REFLECTOR,letter,traceLetter,pressKey} from '../../src/cipher.js';
export {ALPHABET,ROTORS,REFLECTOR,letter,traceLetter,pressKey};
export const TAU=Math.PI*2;
export const mod=n=>(n%26+26)%26;
export const CY=1.45,RADIUS=.7;
export const rotorX=(i,spread)=>(i-1)*(1.1+spread*1.0)-.45;
export const reflectorX=spread=>rotorX(0,spread)-1.2;
export const boardX=spread=>rotorX(2,spread)+1.6;
export function contact(i,n,side,spread){const a=n*TAU/26;return [rotorX(i,spread)+side*.3,CY+RADIUS*Math.cos(a),RADIUS*Math.sin(a)];}
export function socket(n,spread){return [boardX(spread)-.54+(n%13)*.09,.91+Math.floor(n/13)*.37,1.72];}
export function reflectorContact(n,spread){const a=n*TAU/26;return [reflectorX(spread)+.12,CY+RADIUS*Math.cos(a),RADIUS*Math.sin(a)];}
export function wiringContact(rotor,index,positions,spread){
  const output=ALPHABET.indexOf(ROTORS[rotor].wiring[index]);
  return {input:contact(rotor,mod(index-positions[rotor]),1,spread),output:contact(rotor,mod(output-positions[rotor]),-1,spread)};
}
export function internalPoints(start,end){return [start,[start[0]+Math.sign(end[0]-start[0])*.19,CY+(start[1]-CY)*.4/RADIUS,start[2]*.4/RADIUS],[end[0]-Math.sign(end[0]-start[0])*.19,CY+(end[1]-CY)*.4/RADIUS,end[2]*.4/RADIUS],end];}
// Every colored 3D segment uses exactly the input/output indices in cipher.js.
export function segmentPaths(trace,index,spread){
  const s=trace.stages[index];let start,end,lead;
  if(s.rotor!==null){
    start=contact(s.rotor,s.input,s.reverse?-1:1,spread);end=contact(s.rotor,s.output,s.reverse?1:-1,spread);
    lead=index===1?socket(s.input,spread):index===5?reflectorContact(s.input,spread):contact(s.rotor+(s.reverse?-1:1),s.input,s.reverse?1:-1,spread);
  }else if(s.id==='reflector'){
    start=reflectorContact(s.input,spread);end=reflectorContact(s.output,spread);lead=contact(0,s.input,-1,spread);
  }else{
    start=socket(s.input,spread);end=socket(s.output,spread);lead=s.id==='plug-out'?contact(2,s.input,1,spread):[boardX(spread)+.5,.45,2.12];
  }
  let inside;
  if(s.rotor!==null)inside=internalPoints(start,end);
  else if(s.id==='reflector')inside=[start,[reflectorX(spread)+.18,CY,.05],end];
  else inside=[start,[start[0],start[1]-.23,2.03],[end[0],end[1]-.23,2.03],end];
  return [[lead,start],inside];
}
export const BEATS=[
  {at:0,title:'从 A 出发，先让快轮前进一步。',focus:null,spread:.55,cut:true,stage:0},
  {at:7,title:'接线板先交换一对字母。',focus:'wiring',spread:.7,cut:true,stage:0},
  {at:14,title:'电流穿过三只转子，各完成一次替换。',focus:'rotor',spread:1,cut:true,stage:3},
  {at:23,title:'反射器把电流送回同一组三只转子。',focus:'reflector',spread:.8,cut:true,stage:4},
  {at:31,title:'返程使用同一套接线的逆映射。',focus:null,spread:1,cut:true,stage:7},
  {at:40,title:'锁住轮位，反向输入便能回到 A。',focus:null,spread:.55,cut:true,stage:8}
];
export function tourState(t){
  const beat=[...BEATS].reverse().find(b=>t>=b.at)||BEATS[0],pairs=[['A','C']],forward=pressKey('A',[0,0,0],pairs);
  const trace=t>=40?traceLetter(forward.output,forward.positions,pairs):forward;
  const progress=t>=40?Math.min(9,Math.max(0,(t-40)*1.5)):t>=31?Math.min(9,7+(t-31)/3):Math.min(9,beat.stage+Math.min(1,Math.max(0,(t-beat.at)/4)));
  return {...beat,trace,positions:trace.positions,pairs,progress};
}
