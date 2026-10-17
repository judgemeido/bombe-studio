# P3 QA 摘要

日期：2026-10-17
详细矩阵：`docs/HISTORY_00_P3_QA.md`。

## 结论

**已执行范围通过；不是未测场景全部通过或完整无障碍认证。** 本文整理主代理真实浏览器报告及已保存文件，文档工作者没有另开浏览器。未改产品代码、未提交。

- 最终 `npm test` **102/102 通过**（final-tests.txt），`npm run build` 成功（final-build.txt）。早期报告的阶段计数不代表最终结果。
- 桌面 1440×900、4182：根 00→01 拆解（aria-pressed=true）→02 准备实验，按 A 得轮位 AAB、路径 A→C→D→F→S→S→E→B、输出 B→03 首关→00。观察到的 console error logs=[]。
- 五条深链 `#/`、`#/lab/drums`、`#/lab/wiring`、`#/challenge`、`#/history`，直接打开/刷新共 10 个正确结果：deep-routes.json。
- 移动 390×844，五路由 document scrollWidth==clientWidth：mobile-routes.json。375/375 的项是 15px 纵向滚动条所致；lab 两主题为 390/390，不是文档横向溢出。
- 文末 onward 入口→01→00 保持末尾读位。先滚到顶部导航再点击时，保存的是顶部读位，返回首屏符合记录时机。
- 单个键盘点检：历史 00 导航 Tab 下一步到 01 链接，焦点不在 hidden application-shell。**不宣称全面键盘或读屏验收。**

## 初始资源证据

- home-assets.json 为实际浏览器 capability pageAssets 清单，脚本仅 bootstrap、history-loader/scenes chunk、routes chunk；对应 dist chunk 已由主代理核对不含 Three。清单也有 CSS/图片等，**不是完整 HAR**。
- `node output/history-00-p3/check-initial-graph.mjs` 成功；initial-bundle-graph.json 静态闭包仅 bootstrap.js、history-loader.js、history-scenes.js、routes.js 四个源 input，不含 Three/main/model/scene，main 仅为动态导入。
- 两类证据支持首屏轻入口结论，不外推为完整网络、离线、缓存或 GPU 生命周期审计。

## 截图及复核

- desktop-home.jpg、desktop-exhibit.jpg、desktop-lab.jpg、desktop-challenge.jpg、mobile-home.jpg。
- task1-review.md 静态合同通过；task2-rereview.md 原 3 个 findings 修复通过（定向 18 项）；Task3 实施边界见 task3-report.md。
- 挑战 DOM 既有随机 regex 补上“哪一组”问法，仅测试修正，不改业务。

## 保留项

- **A2 肖像待定**；不得宣称已解决。
- noJS、offline、throttling、reduced motion、真实 bfcache **未实际模拟**；仅有相关单元/静态依据。
- 未做全面键盘/辅助技术认证、完整六关浏览器流程、WebGL context 恢复、全设备或长期泄漏检查。
- 固定历史焦点合同为 #hero-title；历史与应用互斥壳、共享壳外 overlay、单 bootstrap 入口的静态/单元依据不代替上述真实环境验证。

本次证据汇总结束，不等待更多材料；后续若扩大验收范围须补实际记录。
