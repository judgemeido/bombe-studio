# P3 Task3 独立只读复核

- 状态：**审核完成，通过（在本次 Task3 源码与自动化测试范围内）**。
- 日期：2026-10-17。
- 对照：`docs/superpowers/plans/2026-10-17-history-00-p3.md` 的 Task3、`output/history-00-p3/task3-report.md`、当前工作区相对 HEAD 的 `src/main.js` diff，以及三个新增文件的完整内容（未跟踪文件不会出现在普通 git diff 中）。
- 主审文件：`src/main.js`、`src/exhibit-runtime.js`、`tests/application.test.mjs`、`tests/exhibit-runtime.test.mjs`。仅为确认控制器默认非活动和纹理所有权，定点读取了被调用接口；未扩散到 Task4 或其他改动的完整审查。
- 未修改产品代码或测试，未提交。

## 具体问题与优先级

**未发现需要整改的 P0 / P1 / P2 / P3 问题。** 以下行号用于标识已核实的实现，而不是缺陷。

## 重点核验

1. **direct lab/challenge 不创建整机：通过。** `src/main.js:140-170` 将 stage、textures、product、raycaster、pointer 及整机指针/context 监听限定在惰性事务内；`src/main.js:234-248` 的 lab/challenge 分支只准备各自控制器，history 直接返回。模块导入不访问 DOM，不创建运行时；工厂内的共享 UI 绑定和 RAF 不等于整机创建。
2. **prepare 不激活：通过。** `src/main.js:234-250` 不修改页面根 hidden/inert、不 setTopic、不 setActive、不 startNewRound；对应操作集中在 `src/main.js:253-272` 的 activate 中。现有控制器初始化默认 inactive。根显隐归 navigation，不再由 prepare 提前揭开目标页。
3. **dispose 与失败回收：通过。** `src/exhibit-runtime.js:6-15,18-26` 逆序释放已登记资源，单个释放异常不会阻断其余资源释放；dispose 幂等，队列启动前以及异步模块加载后检查 disposed。`src/main.js:141-149` 登记 stage/product，并在 product 创建抛错时释放已返回的纹理；成功后纹理由 product.dispose 接管，未重复独立登记。`src/main.js:185-193` 保证模块返回后不启动已销毁应用的控制器，已启动但迟到的控制器交由 own 立即释放。`src/main.js:220-225` 清理 RAF、navigation、三个 runtime、共享监听、移动笔记与调试入口。
4. **失败后重试一次、成功缓存：通过。** `src/exhibit-runtime.js:18-24` 并发共享同一 promise，成功保留、失败清空；`src/main.js:171-181` 同步清空应用侧失败缓存，并保留可读错误提示。定向测试实际覆盖首次 product 失败、stage 释放、随后并发重试只再创建一次、成功后再次访问不重建；并非只核对实现报告。
5. **状态保留与业务边界：通过。** `src/main.js:22,66-108,197-218` 保留原部件选择、拆解/视角/运转处理与非活动页不渲染的条件；切页不清空 state 或成功 runtime。`src/main.js:264-269` 将实验主题切换与挑战回访换题移到真正 activate；第一次挑战激活不额外换题，离开后重入换一次，history 激活不换题，废弃的 prepare 不消耗一轮。未发现本次 main diff 改写教学/挑战业务算法。
6. **context 与未创建对象访问：通过。** `src/main.js:61-64,94-108,129,166-167` 保留视角、控制、context lost/restored 行为，并对惰性创建前可达的 stage/product 调用增加保护。

## 独立运行证据

- `node --test tests/application.test.mjs tests/exhibit-runtime.test.mjs`：**7 passed，0 failed**。
- `npm test`：**102 passed，0 failed**，exit code 0；包含既有教学/挑战与模型回归测试。
- 实施报告记录的 96 项是此前快照；本次实际工作区测试数量为 102，不沿用旧数字。

## 验证边界

- 本次不执行构建（避免只读复核产生额外构建产物），不将实施报告中的 build 成功视为独立复验。
- 不宣称已完成真实 GPU/context 恢复、网络 waterfall、深链刷新截图、移动端与焦点操作验收；这些属于 Task4。
- 如构造器内部抛错且未返回资源，调用方无法取得并释放其内部对象；本次确认的是已返回/已登记资源的所有权与回收。此边界已在实施报告中披露，未将其虚报为已解决或作为本次新增缺陷。

**最终意见：Task3 本次独立审核通过；无具体缺陷需要返工。此结论不等价于整个 P3 / Task4 已验收。**
