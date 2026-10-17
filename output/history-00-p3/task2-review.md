# P3 Task2 独立只读复核

- 日期：2026-10-17
- 结论：**需修改后复核**。既有 12 项 bootstrap/navigation 测试通过，但额外可控 Promise 检查复现了 2 个 P2 和 1 个 P3 问题，均在 bootstrap 的交接前状态管理中。
- 范围：计划 Task2；`src/bootstrap.js`、`src/navigation.js`、`src/history-loader.js`、`src/history-preview.js` 与指定测试；为验证依赖边界及测试夹具，附带阅读 routes/history-scenes 和静态 overlay 标记。
- 不评判 main 的未集成实现；不修改产品文件、测试文件或其他代理工作。没有用当前 main 作为上述结论的依据。

## Findings

### 1. [P2] 用户已回历史，旧 import 的拒绝仍会重新显示错误遮罩

**定位：** `C:/Codex/city/bombe-studio/src/bootstrap.js:51-56`（对照成功路径 44-45 行及 `go()` 61-65 行）。

**复现：**
1. 无 hash 启动，注入返回 deferred Promise 的 `loadApplication`。
2. `boot.go({page:'lab'})`，等待 loader 已调用。
3. Promise 未完成时 `boot.go({page:'history'})`，此时历史正文重新可读，overlay 被隐藏。
4. 拒绝该 Promise，例如 `reject(Error('offline'))`，清空微任务。

**实测：** `hash="#/history"`、`body.dataset.page="history"`，但 `#page-transition.hidden=false`、`data-state="error"`。最后请求本应保留历史页面，却被已失效的加载错误重新遮盖。成功分支检查 `desired.page`，失败分支只检查 disposed/suspended，因此不具备同等的过期结果防护。现有“pending import 不夺回历史”测试只覆盖 resolve。

**建议：** 拒绝后可以清理失败缓存，但仅在当前 desired 仍需交互应用时发布错误 UI；否则保持历史及 overlay/aria-busy 的最终状态。增加“lab→history→reject”及原生历史锚点后 reject 的断言。若引入 revision，注意一个仍有效的共享 import 可以服务后来请求，不能误丢后来交互请求的失败提示。

### 2. [P2] 共享 import 期间再次离开历史，不恢复 loading overlay / aria-busy

**定位：** `C:/Codex/city/bombe-studio/src/bootstrap.js:35-39`（调用路径 61-65 行，历史清理在 33 行）。

**复现：**
1. 使用 deferred loader，从历史 `go(lab)`。
2. 加载中 `go(history)`，使 `showHistory()` 清除 overlay 和 aria-busy。
3. 原 Promise 仍 pending 时 `go(challenge)`。

**实测：** URL 已是 `#/challenge`，但页面仍为 history，`#page-transition.hidden=true`，body 无 `aria-busy`。旧 Promise 完成前一直没有加载反馈。原因是 `loading=true` 导致 `handoff()` 在第 36 行直接返回，而 UI 更新在 guard 之后；这不是需要重复调用 loader 的问题。

**影响：** 快速路由的最终应用入口虽会在 resolve 时正确选 challenge，但等待期间 URL、可见章节和忙状态脱节，慢网下表现为点击无响应。第一次调用能显示的 loading 状态，在同一个有效 import 的第二次交互请求中丢失。

**建议：** 将“当前 desired 对应的 loading UI”与“启动/复用 import”解耦；即使复用 in-flight Promise，也应根据最新请求恢复 loading/aria-busy。补充 lab→history→challenge（Promise 仍 pending）的中间态断言，以及最后只创建一次工厂的断言。

### 3. [P3] 首次交互加载的 overlay 章节元数据不随目标更新

**定位：** `C:/Codex/city/bombe-studio/src/bootstrap.js:38-40`；默认静态值来自 `C:/Codex/city/bombe-studio/index.html:98`。

**复现：** 以 `#/challenge` 或旧 `#/` 直达，令 `loadApplication` 长时间 pending；读取 `#route-title` / `#route-chapter`。

**实测（challenge）：** 仍为“让信号，穿过逻辑。”和 `02 / THE SIGNAL LAB`，而当前请求应为 03。bootstrap 只写通用 caption，直到模块完成并由导航接管才可能改正。该问题在模块尚未解析时已可观察，与 main 实现无关。

**建议：** 交接前用最新 desired 设置 overlay 的 title/chapter（必要时重置进度/计数）；避免与 navigation 元数据漂移，可抽出轻量 metadata。测试初始 challenge/exhibit 及 pending 时 lab→challenge 的 overlay 内容。

## 已检查而未发现独立阻断问题的部分

- **初始 history 不加载 main/Three：** bootstrap 静态 imports 为 routes/history-loader/history-scenes，历史/章节白名单分支不调用 loader；默认 main 为动态 import。指定测试验证无 hash 与 sources 锚点不触发应用加载。未将此静态/单元结论冒充完整浏览器网络验收。
- **成功异步交接：** import resolve 时读取最新 desired，回历史不会建应用；成功缓存复用且工厂只建一次。工厂接口按计划为同步返回 `{go,dispose}`，未假设它返回 Promise。
- **交接后的监听：** bootstrap 的 click/hashchange/popstate/retry/back 监听仍在，但均以 handedOff guard 退出；应用 go 为唯一执行导航方。这里是保留的惰性监听，不是两个监听器同时争抢路由。历史生命周期控制仍留在 bootstrap，因此不建议简单移除全部生命周期监听。
- **失败重试：** 未过期的 import 拒绝清除 modulePromise，可重新调用注入 loader；第 1 项指出的是过期失败 UI，不是否认可重试路径本身。
- **navigation 的异步结果隔离：** revision 阻止过期成功/失败激活及更新进度；prepare pending 时的新请求排队，旧请求结束后处理最终路由。并非立即取消 prepare；未将慢 prepare 的串行等待当成额外 bug。
- **dispose：** bootstrap 的 await 后有 disposed 检查；navigation 的 prepare 后也有检查；loader decode/事件/超时在 destroy 后不能更新状态。幂等测试通过。
- **bfcache：** 历史控制器卸载/重新挂载测试通过；额外注入 navigation prepare、在 persisted pagehide 后 resolve、再 pageshow，得到激活序列 `[history,lab]`，最终 current=lab、busy=false、overlay 隐藏。源码也阻断 suspended 时异步激活。不把 happy-dom 事件模拟等同于真实浏览器 bfcache 验收。
- **modified click / 原生锚点：** Ctrl/Meta/Alt/Shift、非主键、download/外部 target 不被导航 click handler 拦截；无 data-page 历史锚点原生处理。同 history hash 不重新 prepare。
- **scroll / 可见性 / 导航状态：** navigation 在离开当前页时记录 scroll，history 返回恢复；heading focus 使用 preventScroll；hidden/inert、title、aria-current 有测试。bootstrap 将历史读位通过 historyPage.scrollY 交接。main 如何消费该合同留给集成验收，不作未集成推断。challenge 明确重置 scroll=0。
- **history-preview/loader：** 单独预览缓存恢复会创建新控制器；旧实例永久 destroy；loader 无媒体时也不阻塞正文。未发现需要另报的问题。

## 验证记录

1. `node --test tests/bootstrap.test.mjs tests/navigation.test.mjs tests/routes.test.mjs` → **15/15 PASS**（指定两文件为 12 项）。
2. `node --test tests/bootstrap.test.mjs tests/navigation.test.mjs tests/routes.test.mjs tests/history-preview.test.mjs tests/history-scenes.test.mjs` → **34/34 PASS**。
3. `node --test tests/history-preview-controller.test.mjs` → **24/24 PASS**。
4. 内存 happy-dom / deferred Promise 复现，未写入或修改测试：
   - `STALE_REJECTION {"hash":"#/history","page":"history","overlayHidden":false,"state":"error","busy":null}`
   - `NEW_REQUEST_DURING_OLD_IMPORT {"hash":"#/challenge","page":"history","overlayHidden":true,"busy":null}`
   - `INITIAL_CHALLENGE {"title":"让信号，穿过逻辑。","chapter":"02 / THE SIGNAL LAB","busy":"true"}`
   - `NAV_BFCACHE_RESOLVED_WHILE_HIDDEN {"acts":["history","lab"],"current":{"page":"lab","topic":"drums"},"busy":false,"overlayHidden":true}`

复现夹具使用指定 bootstrap 测试同款的 Window、overlay ID 和 microtask tick，`mountHistory:()=>({destroy(){}})` 隔离媒体副作用；工厂完全注入，不触碰 main。上述 3 个 findings 在工厂执行之前即可复现。

审查时关键文件 SHA256（并发实施下标记本次快照）：
- bootstrap.js: `B804815885D69EB4F9C2F04DE7136B87E201342C0248E7CD25694305BEDD200C`
- navigation.js: `869E81A63143F0092268E96F03DAB00A89A746D9E66A5B3403F1A1F80F844052`
