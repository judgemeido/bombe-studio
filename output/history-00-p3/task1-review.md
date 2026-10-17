# P3 Task1 独立只读复核

- 日期：2026-10-17
- 状态：**审核完成；Task1 静态合同范围内通过，未发现可复现的阻断问题。**
- 范围：依据 `docs/superpowers/plans/2026-10-17-history-00-p3.md` Task1 与 `output/history-00-p3/task1-report.md`，独立检查 routes、HTML 合成、两个 HTML 入口、两份作用域 CSS、build/dev-server 和 routes/page-shell/history-preview 测试。未修改产品源码；按允许执行 build（刷新生成的 dist），仅新增本复核报告。

## 结论与证据

1. **静态正文单一来源与边界**：`page-shell.mjs:1–18` 仅提取明确且唯一的 APP-SHELL / HISTORY-CONTENT / SHARED-TRANSITION 标记；当前模板的历史正文保留七幕、页头、页尾与来源，应用为 hidden/inert，共享过渡层为两根的兄弟节点。聚焦测试验证正文与源 outerHTML 一致、全页 ID 唯一、对话框保留，首页只有 bootstrap 自动入口，不叠加独立 preview 启动。
2. **CSS 隔离**：检查 styles.css、history-preview.css 的选择器，应用通用规则限定在 application-shell/page-transition，历史通用规则限定在 data-history-preview，body 规则按历史模式约束；保留的全局 hidden 与 body margin 为有意共享规则。两份 CSS 的 esbuild 解析无警告。没有发现本次静态检查可证明的跨根污染。
3. **默认 00 与旧深链**：`src/routes.js` 空 hash、#/history 及明确历史锚点白名单归 history；#/、lab drums/wiring、challenge 保持往返，未知片段回 exhibit。测试通过。此结论为纯路由合同，不代替 Task2/3 的浏览器导航生命周期验证。
4. **资产与两个入口**：build/dev-server 均使用 renderHome；build 已成功。对实际生成的 dist/index.html 和 dist/history-preview.html 解析检查，分别 12 / 9 个本地脚本、样式、图片及 diagram-source 引用存在，两入口均保留七幕。开发服务代码中的路径允许列表、realpath 根目录校验、历史资产子目录校验与图片 MIME 已检查；本次未另启 HTTP 服务。
5. **要求等待的两项修正已落盘**：`history-preview.html:30,34` 使用 aria-labelledby="hero-title" 与 h1#hero-title[tabindex="-1"]；`:6–7,16,221` 已为“七幕档案”等中性发布文案，不再声称首页尚未替换。page-shell 回归测试已通过；A2 肖像仍标为待核实。相关旧问题不列为未解决项。

## 独立执行结果

```text
node --test tests/routes.test.mjs tests/page-shell.test.mjs tests/history-preview.test.mjs
20 tests / 20 pass / 0 fail

npm run build
exit 0，esbuild Done in 80ms

生成入口本地资源存在性检查
 dist/index.html: 12 local resources exist, scenes=7
 dist/history-preview.html: 9 local resources exist, scenes=7
```

## 问题清单

**无已证实的 P0/P1/P2 阻断项；无须提供产品修复行号。** 不将假设性 marker 损坏或尚未执行的浏览器检查伪装成当前可复现缺陷。

## 验证边界

本次是 Task1 静态合同审查，不是 P3 整体验收。未执行真实浏览器桌面/手机视觉与键盘检查、初始网络请求依赖检查、深链刷新运行时、动态加载失败/竞态或 WebGL 延迟初始化验证；这些仍属于 Task2/3/4 与集成 QA，不能由本报告推断已通过。未为赶进度修改产品代码或扩大任务范围。
