# 04 模型细化与场景过渡 Implementation Plan

> **For agentic workers:** Use executing-plans to implement this plan in the current session. User has directly requested these corrections; proceed within that scope.

**Goal:** 细化 04 的三维机械结构，并用可跳过的实时场景过渡替换视频。

**Architecture:** 保留原生 Three.js 和七关状态机。独立纯函数投影过渡镜头，渲染器使用自己的可暂停时钟；UI 负责跳过、暂停与进入下一任务。模型几何、材质和可动部件分层，重复静态件合并以控制绘制开销。

**Tech Stack:** JavaScript ES modules, Three.js 0.180.0, esbuild, node:test, happy-dom.

**Spec:** 本次用户要求：04 建模更精细；动画作为可跳过的内嵌过渡，不使用视频。沿用七关、三至九年级及成人、约十分钟课堂节奏。

## Global Constraints

- 不改现有密码算法或任务答案；不迁移框架或引入新依赖。
- 入场约 10 秒，关间约 2.4 秒，同一 canvas 渲染，字幕与跳过/暂停按钮为 DOM。
- 保留旧 Remotion 源码作为历史资料，线上运行入口不再引用视频。
- 提供无 WebGL 和减少动态效果路径；取消/销毁后不能被旧回调推进关卡。
- 本次成果先在本地验收；GitHub 现有版本保持可追溯。

## Review Focus

- 快速重复开始/跳过不能双重推进。
- 切章、隐藏页面、暂停和销毁不能消耗时间或迟到推进。
- 动画完成后的键盘焦点应在任务标题。
- 按键字母、转子与灯号应跟随真实状态，不能漂浮或脱节。
- 手机镜头和字幕不能遮住跳过按钮或造成横向溢出。

## Task 1: 实时过渡

Files: `src/mission-transition.js`, `src/mission-scene.js`, `src/mission.js`, `src/mission-template.js`, `mission.css`, `tests/mission-transition.test.mjs`, `tests/mission-ui.test.mjs`.

Interfaces: `transitionFrame({ kind, stage }, seconds)` returns duration/progress/caption/camera/target/lidOpen/done. Scene exposes `playTransition`, `skipTransition`, `pauseTransition`, `cancelTransition`; UI owns the single completion action.

- [x] 先写过渡终点/连续性和 UI 跳过、无 WebGL、取消后旧回调测试并运行确认失败。
- [x] 实现同一场景实时镜头、盖板动作、字幕；移除 video 元素和媒体生命周期。
- [x] 运行相关测试确认通过。

## Task 2: 模型工艺

Files: `src/mission-craft.js`, `src/mission-model.js`, `src/mission-scene.js`, `tests/mission-model.test.mjs`.

Interfaces: 模型保持 `root/rotors/drums/update/dispose`；增加可动 `keys/lamps/lid`，`update` 接收 `lidOpen`。工艺工具提供共享几何、程序化木纹与表面纹理、静态批处理。

- [x] 先写按键与字标同步、盖板姿态、资源释放测试并确认失败。
- [x] 重建木盒合页/卡扣、双插孔接线板、圆键帽与灯板、转子齿圈与轴承、机柜分段面板/鼓轮/紧固件、无线电与工作桌。
- [x] 配置冷窗光、暖桌灯与中性反射环境；检查近景和全景，控制真实 draw calls。

## Task 3: 验证与交接

- [x] 全量 `npm.cmd test`、`npm.cmd run build`、`git diff --check`。
- [x] 浏览器检查入场自动结束/跳过/暂停、关间过渡、七关、桌面及手机近景；保存截图。
- [x] 按执行技能完成一次独立只读审阅，修复重要问题。
- [x] 更新 README 和验收/交接记录，准确区分实测与仍需课堂试讲的内容。

## 执行记录（2026-10-19）

- 完成前验证：159/159 测试、build 与 diff 检查通过。桌面与手机七关完成。
- Ruling: 外露教学转子需要空间，盖板改为从半开姿态打开；代价是不演出全闭木盒。保持用户要求的实时 3D 过渡。
- Final: fixed 暂停期间降级回调推进 — 两项回归测试 RED→GREEN。
- Final: fixed WebGL 恢复环境丢失 — 环境资源替换/失败保留测试 RED→GREEN。
- 视觉反馈后修正接线穿桌与 320px 观察按钮拥挤。最终证据见 MISSION_REFINEMENT_ACCEPTANCE.md。
