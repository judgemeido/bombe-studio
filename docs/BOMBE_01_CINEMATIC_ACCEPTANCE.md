# Bombe 01 精细建模与影院运镜验收

日期：2026-10-20（Asia/Shanghai）。

## 交付范围

- 保留五个公开系统、108 个鼓轮、拆解/聚焦/拾取/重置 API，并在鼓轮周围增加环、轮毂、触点环、索引标记、紧固件、后轴套和信号层。
- 使用程序化金属拉丝纹理和本地材质，动态效果只作用于转子机械相位、短脉冲信号和运行态轮廓光。
- 增加五段影院运镜：整机建立、上层转子特写、转子/传动横移、后部接线、回到三分之四整机视图。
- 影院运镜可由按钮或 `C` 启动；OrbitControls 的拖动或缩放会立即中断运镜并保留当前视角。
- 后处理使用可选的 `EffectComposer`/Bloom；不可用、减少动态效果或上下文丢失时回退到普通 renderer。

## 自动化验证

| 检查 | 结果 |
|---|---|
| Bombe 01 模型、影院相机、场景渲染、应用控制 | 17/17 通过 |
| `npm.cmd run build` | 通过，生成 `dist/` |
| `git diff --check` | 通过；仅有既有 CRLF→LF 提示，无空白错误 |
| `npm.cmd test` | 183/184 通过 |

完整测试唯一失败项来自既有 mission 工作区改动：`tests/mission-model.test.mjs` 的 “working furniture has legs, seats and recognizable equipment instead of solid placeholder blocks”，断言 `instancing must survive world batching`。该测试不导入 Bombe 01 的模型、影院相机或后处理代码；本轮未改动该失败路径。

## 浏览器验收

本地服务：`http://127.0.0.1:4174/#/`。

- 已观察 01 页面正常加载，三维模型可见，转子新增细节在整机视图中可见。
- 已观察“影院运镜”按钮存在；启动后按钮切换为“停止运镜”，状态播报为“影院运镜已开始，镜头将依次经过转子、传动与接线”。
- 已确认 108 鼓轮仍属于同一展品，原有拆解、目录、相机视角和运转控制保留。
- 影院运镜的手动中断、减少动态效果落位、移动端安全框和渲染降级由 `tests/cinematic-camera.test.mjs`、`tests/application.test.mjs`、`tests/scene-render.test.mjs` 覆盖。

## 运行时检查接口

打开 01 页面后，可在开发者控制台执行 `window.__BOMBE_INSPECT__()`，读取：

- `ready`、`contextLost`、`reducedMotion`；
- `phase`、`drums`；
- renderer 的 `calls`、`triangles`、`geometries`、`textures`；
- 当前 `camera` 与 `cameraTarget`。

该接口用于复核运行时状态，不代表跨设备 FPS 保证。项目仍是教学性结构重建，不声称为可制造的历史 CAD 或完整密码运算模拟。

## 证据边界

本轮使用内置浏览器完成了桌面首屏和影院控制可见性检查；未生成新的 PNG 文件。移动端和减少动态效果的行为有自动化测试覆盖，但没有把浏览器截图作为发布证据。未强制模拟所有 WebGL 上下文恢复、GPU 性能和真实屏幕阅读器环境。
