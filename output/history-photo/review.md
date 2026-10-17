# 影像改版独立只读复核

日期：2026-10-17。范围仅限本次照片替换、gallery controller、bootstrap/preview 接入、相关 CSS/测试和随附来源记录；已包含手机 swipe 小补。没有修改产品、测试、素材或构建产物，仅写本报告。

## 发现

### [P2] controller 工厂没有按 gallery 去重；交叠挂载后的 destroy 会恢复到错误快照

位置：`src/history-gallery.js:9–15,74–83,145–151`。

`records` 仅属于一次工厂调用。对同一 DOM（包括 Document 与其中的 gallery 两种交叠 root）再次调用 `createHistoryGalleries`，会重复注册 observer、事件和 timer。第二个实例还会把第一个实例添加的 `gallery-enhanced`、slide hidden、已展开 controls 当作“原始状态”。按先挂先销毁的顺序清理时，第一个 destroy 使仍活动的第二个实例失去 CSS hook 并隐藏 controls；第二个 destroy 又把 DOM 恢复成已增强状态，而此时已经没有活动 controller。

最小复现（仓库目录中运行，使用现有依赖，不修改文件）：

```js
import { Window } from 'happy-dom';
import { createHistoryGalleries } from './src/history-gallery.js';
const w = new Window();
w.document.body.innerHTML = `<div data-history-gallery>
  <div class="gallery-slides"><figure data-gallery-slide>A</figure><figure data-gallery-slide>B</figure><figure data-gallery-slide>C</figure></div>
  <div class="gallery-controls" hidden><button data-gallery-next>Next</button><output data-gallery-count>static</output></div>
</div>`;
let id = 0;
const tasks = new Map();
const clock = {
  setTimeout(fn) { tasks.set(++id, fn); return id; },
  clearTimeout(id) { tasks.delete(id); },
};
const a = createHistoryGalleries(w.document, { clock, Observer: null });
const b = createHistoryGalleries(w.document, { clock, Observer: null });
// tasks.size === 2：同一 gallery 两个 timer
const state = () => ({
  timers: tasks.size,
  enhanced: !!w.document.querySelector('.gallery-enhanced'),
  visible: [...w.document.querySelectorAll('figure')].filter(x => !x.hidden).length,
  controlsHidden: w.document.querySelector('.gallery-controls').hidden,
});
console.log(state());
a.destroy(); console.log(state());
b.destroy(); console.log(state());
await w.happyDOM.abort();
```

本次实测输出：

```text
two mounts:    timers=2
destroy first: timers=1 enhanced=false visible=3 controlsHidden=true
destroy both:  timers=0 enhanced=true  visible=1 controlsHidden=false
```

预期：同一 gallery 不发生并行所有权，所有 owner 释放后回到静态全部照片可读、controls hidden。建议按 gallery 建立跨调用的所有权/去重机制，并覆盖相同 root 和交叠 root 的回归测试；具体是共享、拒绝还是幂等返回，需统一 destroy 语义。

**触发边界**：当前两处入口各自有实例变量 guard，首页 composition 也只保留一个自动入口；本次没有发现正常路由/BFCache 路径必然重复调用工厂。因此这是对用户明确要求“controller 不重复挂载”的 API 边界缺口，不应描述为当前页面每次加载都挂两遍。

### [P3] 随附 notices 仍保留与本次发布状态冲突的旧说明

位置：`THIRD_PARTY_NOTICES.txt` 的旧 HISTORY 段（新增 `HISTORY PHOTOGRAPHIC ARCHIVE` 之前）。

当前文件仍写着 `The Turing type composition is original layout, not an archival portrait.` 和 `A2 portrait remains pending and is not distributed.`，而本次 HTML 的 A2 与新增 notices 已发布 16 岁肖像。`build.mjs` 会原样复制该 notices，故发布包内可直接复现前后两套状态说明。

这不是把少年照片误认为战时照，也不质疑已记录的 Commons 许可。建议把旧说明明确限定为“已弃用的排字占位/此前 Elliott & Fry 候选”，或移除失效的当前时态。属于非阻塞文档一致性问题。

## 核查通过及边界

- 小补后全量 `node --test tests/*.test.mjs`：**121 tests / 121 pass / 0 fail**。其中新增三项 swipe 测试覆盖左右切换、阈值/纵向/cancel/mismatch、交互元素排除及 destroy 后监听器清理。
- esbuild 使用现有 `build.mjs` options、`write:false`：成功产生 18 个内存输出；未执行会写 dist 的发布构建。
- bootstrap 的 `enhancements` guard 和 preview 的 `controller` guard 防止各自正常生命周期重复 mount；persisted pagehide 销毁、pageshow 重建和非 persisted 离开清理的现有测试均通过。应用接管后导航仍调用 history activate/deactivate；导航自身负责 BFCache 恢复。
- 单实例 destroy 幂等，清 timeout、disconnect observer、移除 motion/visibility/hover/focus/click/pointer 监听并恢复 DOM；晚到 observer 回调受 destroyed guard 限制。
- 在真实 Chromium 页面检查到 6 个 gallery。另以相同 HTML 去掉 script、仅注入资源 base 的内存 HTTP fixture 验证：13 张 gallery figure 全部参与显示，6 个 controls 的 computed display 全为 none。该 fixture 未禁用浏览器 JavaScript，故它验证的是“增强脚本未执行”的静态退化，不冒充完整浏览器禁用脚本测试。
- 查看新增 CSS 与真实布局；现有 desktop、690px 边界未发现可确认的控制栏/图注覆盖问题。390px 无溢出与 broken image=0 是用户提供的验证结果，未将其伪称为本次独立重测。
- swipe 已有 `touch-action: pan-y pinch-zoom`，未阻止默认纵向滚动；本次用测试和代码复核，未用实体触屏验证手势体验。
- 限定核对采用影像的 manifest/图注：少年图灵明确为约16岁、非战时；现代实物与场址已有说明；Arkley 影像年份与数字文件日期有区别。没有新增可证实的史料误标问题。未开展外部素材/许可的无界研究。
- `bombe-rebuild` 已移除且不在当前 manifest 中；来源清单为 11 张采用影像，不将旧候选列为缺陷。

## 收束

保留 **1 项 P2 controller 重入边界问题、1 项 P3 notices 一致性问题**。未发现单次挂载正常路径的资源泄漏或 hidden 导致无脚本照片不可读；测试/构建通过不等于覆盖重复工厂调用这一场景。无需扩大审计范围。
