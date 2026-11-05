import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {createChapterFrame} from '../src/chapter-frame.js';
test('a chapter handshake accepts only the owned same-origin frame and gates child navigation by activity',async()=>{
  const win=new Window({url:'http://localhost/'}),root=win.document.createElement('main'),routes=[];win.document.body.append(root);
  const controller=createChapterFrame(root,{page:'lab',navigate:r=>routes.push(r),window:win}),frame=root.querySelector('iframe');
  const send=(type,extra={},source=frame.contentWindow,origin=win.location.origin)=>win.dispatchEvent(new win.MessageEvent('message',{source,origin,data:{channel:'bombe-chapter-v1',type,...extra}}));
  send('ready',{},win);send('ready',{},frame.contentWindow,'https://elsewhere.example');assert.equal(controller.inspect().ready,false);
  send('ready');await controller.ready;assert.equal(controller.inspect().ready,true);send('route',{page:'mission'});assert.equal(routes.length,0);
  controller.setActive(true);send('route',{page:'mission'});send('route',{page:'unrecognized'});assert.deepEqual(routes,[{page:'mission',topic:undefined}]);controller.dispose();assert.equal(root.children.length,0);await win.happyDOM.close();
});
test('unresponsive frame preparation rejects and is disposable',async()=>{
  const win=new Window({url:'http://localhost/'}),root=win.document.createElement('main');win.document.body.append(root);
  const controller=createChapterFrame(root,{page:'exhibit',navigate(){},window:win,timeout:10});await assert.rejects(controller.ready,/超时/);controller.dispose();await win.happyDOM.close();
});
