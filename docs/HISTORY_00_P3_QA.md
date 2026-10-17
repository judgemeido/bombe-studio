# 00 战时序章 P3 · QA 记录

日期：2026-10-17
范围：默认历史首页、兼容旧深链、轻入口、页面壳隔离及交互章回归。
环境：主代理真实浏览器 `http://127.0.0.1:4182/`；桌面视口 1440×900，移动视口 390×844。

## 结论与证据口径

**本次已执行的浏览器冒烟、深链/刷新、移动端宽度、首屏资源检查及自动化回归通过；不等同于全部 QA 场景或完整无障碍认证通过。**

本文由文档工作者读取现有证据并汇总主代理明确报告的真实浏览器操作；文档工作者未另开浏览器。JSON、截图、测试和构建日志均保存在 `output/history-00-p3/`。未执行的项目在下文明确列出，不用单元模拟代替真实浏览器验收。A2 肖像素材仍待定。

## 1. 真实浏览器回归矩阵

| 项目 | 操作与观察 | 证据与边界 |
| --- | --- | --- |
| 默认首页 00 | 桌面根地址无 hash 显示七幕战时序章 | 主代理浏览器观察；desktop-home.jpg |
| 00→01 | 进入机械全貌，执行拆解；拆解按钮 `aria-pressed=true` | 主代理操作；desktop-exhibit.jpg。不据此宣称所有 3D 控件、GPU 恢复均测过 |
| 01→02 | 准备实验并按 A：轮位 AAB，路径 A→C→D→F→S→S→E→B，输出 B | 主代理操作；desktop-lab.jpg。是一次具体信号流程，不是穷举密码规则 |
| 02→03→00 | 进入挑战首关，再返回历史 | 主代理操作；desktop-challenge.jpg。未声称浏览器完整走通六关 |
| 五条深链及刷新 | `#/`→exhibit；`#/lab/drums`、`#/lab/wiring`→lab；`#/challenge`→challenge；`#/history`→history。每条直接打开及刷新各一次，共 10 个正确结果 | deep-routes.json 记录 hash/page；执行方式由主代理报告，JSON 未逐条标注打开/刷新阶段 |
| 移动端宽度 | 390×844 下，上述五条路由均 `document.scrollWidth == document.clientWidth`，未见文档级水平溢出 | mobile-routes.json；mobile-home.jpg。exhibit/challenge/history 为 375/375，lab 两主题为 390/390；375 是扣除 15px 纵向滚动条后的客户端宽度，不是视口被改为 375 |
| 历史读位 | 在文末 onward 的入口切至 01，返回 00 后保持末尾读位 | 主代理真实操作报告；未单独保存结构化滚动坐标 |
| 顶部导航读位解释 | 为点击顶部导航而先滚回导航位置后才离开，保存的是此时的顶部读位，因此返回首屏符合记录时机 | 与从文末入口离开不同，不把这一情形记为读位丢失 |
| 单个键盘点检 | 从历史 00 导航 Tab 下一步到 01 链接；活动焦点不在 hidden application-shell 中 | 主代理真实操作报告；仅一个键盘点检，不是全流程键盘、焦点陷阱或读屏认证 |
| 控制台 | 上述操作观察到的 error logs 为 `[]` | 主代理报告；不外推为所有路径、设备或长时间运行均无错误 |

截图仅为对应时刻的视觉记录，不能单独证明交互过程、布局全覆盖或网络行为。

## 2. 首屏轻入口：运行时资源 + 静态入口图

### 2.1 实际页面资产清单

主代理通过浏览器 capability `pageAssets` 获取 home-assets.json。首屏脚本清单只有：

- `dist/bootstrap.js`
- `dist/chunks/chunk-PSBY7LGZ.js`
- `dist/chunks/chunk-XPUFKDNR.js`

后两项对应 history-loader/history-scenes 与 routes 的轻量共享代码；主代理已核对对应 dist chunk 源码不含 Three。清单同时包含 CSS、图片和内联 SVG 等资产，不能将“只有三个脚本”表述为“页面只有三个资源”。

**这不是完整 HAR，也不是带时序、传输字节、缓存和请求失败信息的全量网络瀑布。** 它支持此次初始 00 页面资产观察，不用于证明所有浏览器缓存策略、离线或限速表现。

### 2.2 esbuild 静态依赖图

主代理执行 `node output/history-00-p3/check-initial-graph.mjs` 成功，保存 initial-bundle-graph.json。沿 bootstrap 静态入口图得到的源 input 恰为：

1. `src/bootstrap.js`
2. `src/history-loader.js`
3. `src/history-scenes.js`
4. `src/routes.js`

静态入口闭包不含 Three、main、model 或 scene；main 保留为 `dynamic-import`（本次输出 `main-JAZY5KZG.js`），不纳入初始静态闭包。此静态证据与首屏 pageAssets 互相补充，支持“默认 00 无需先加载交互应用依赖”的结论。它不独立证明 GPU 对象从未创建，也不等同于运行时完整网络审计。

## 3. 单元、静态合同与构建

最终保留日志：

| 命令/检查 | 结果 | 证据 |
| --- | --- | --- |
| `npm test` | **102 passed / 0 failed / 0 skipped** | final-tests.txt |
| `npm run build` | 成功，esbuild 完成 | final-build.txt |
| 静态入口图脚本 | 成功，4 个源 input、main 仅动态边 | check-initial-graph.mjs、initial-bundle-graph.json |
| Task1 独立静态复核 | 合成、作用域 CSS、资源引用及路由合同范围通过 | task1-review.md |
| Task2 修复定向复核 | 原 3 个 findings 已解决；bootstrap/navigation 18 项通过 | task2-rereview.md；不是完整浏览器生命周期复核 |

自动化依据涵盖：路由白名单与旧路由、正文合成/唯一 ID/单启动入口、hidden/inert 壳、并发请求最后一次胜出、导入失败重试与过期拒绝、延迟展品初始化及资源释放、图片超时回退、缺失观察器、减少动画和 pagehide/pageshow 模拟。具体边界以各测试与报告为准。

挑战 DOM 测试既有随机题目断言遗漏“哪一组”这一合法问法，本次仅修正测试 regex，未改挑战业务、题目规则或答案逻辑。早期任务报告含阶段性测试计数/失败，最终自动化结果以 final-tests.txt 和 final-build.txt 为准。

## 4. 静态交付合同

- 默认无 hash 与 `#/history` 为 00；旧 `#/` 为 01。历史章节使用明确白名单原生锚点，不冒充交互章路由。
- 历史正文从 history-preview.html 显式标记区域合成，七幕、图注、来源、页头/页尾保持单一来源；独立 preview 入口保留。
- `#history-page[data-history-preview]` 初始可读，`#application-shell` 初始 hidden/inert；共享 `#page-transition` 在两根之外。固定历史焦点目标为 `#hero-title[tabindex="-1"]`。
- 首页仅 bootstrap 自动入口；不叠加 app/historyPreview 两个竞争启动入口。开发与生产共用 renderHome。
- 历史通用样式限定至 `:where([data-history-preview])`，应用通用规则限定至 application-shell/共享 overlay；保留必要的全局 hidden 和 body margin 规则。

这些是自动化/静态核验依据，不把源码中存在无 JS 正文或 CSS 媒体查询等同于对应真实浏览器场景已测试。

## 5. 未执行项目、限制及后续建议

| 项目 | 本次实际覆盖 | 尚未完成的真实环境验证 |
| --- | --- | --- |
| 禁用 JavaScript | 静态 HTML 七幕正文/图注/来源合同 | 未实际禁用 JS 打开首页或 preview |
| 离线、失败网络、限速 | 单元可控 Promise 拒绝/重试与图片超时；静态资源图 | 未真实 offline/throttling、阻断请求或完整 HAR 采集 |
| reduced motion | 单元模拟与 CSS 静态规则 | 未在真实浏览器/系统偏好中切换验证 |
| bfcache | pagehide/pageshow 与恢复的单元模拟 | 未真实后退/前进缓存恢复验收 |
| 全面键盘与辅助技术 | 00→01 链接的一次 Tab 点检、焦点不落隐藏壳 | 未覆盖完整 Tab 顺序、所有 dialogs、焦点陷阱、读屏或完整无障碍审计 |
| 3D 与设备兼容 | 桌面拆解、信号实验及移动宽度检查 | 未做 WebGL context lost/restored、全部交互/设备矩阵或长期资源泄漏测试 |
| 历史素材 | 七幕与来源说明保留 | **A2 肖像仍待定**，不得标为素材问题已解决 |

如需将上述场景纳入正式验收，后续须补实际浏览器记录；本次不等待额外证据，不将未测项静默改为通过。

## 6. 证据索引

目录：`output/history-00-p3/`。

- 自动化：final-tests.txt、final-build.txt。
- 资源：home-assets.json、check-initial-graph.mjs、initial-bundle-graph.json。
- 路由/宽度：deep-routes.json、mobile-routes.json。
- 截图：desktop-home.jpg、desktop-exhibit.jpg、desktop-lab.jpg、desktop-challenge.jpg、mobile-home.jpg。
- 独立复核/实施说明：task1-review.md、task2-rereview.md、task3-report.md。
- 简版结论：qa-summary.md。

本文与简版仅整理证据；未修改产品源码、未提交代码。
