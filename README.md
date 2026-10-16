# BOMBE · 译码档案

使用 `three-product-studio` 开发的可拆解 3D 展示页。对象为二战时期的 **Turing–Welchman Bombe** 机电破译机，区别于理论计算模型“图灵机”和 Enigma 加密机。

## 运行

需要 Node.js 22 或更新版本，使用 PowerShell：

```powershell
cd C:\Codex\city\bombe-studio
npm.cmd ci
npm.cmd run dev
```

打开 `http://127.0.0.1:4173`。默认只监听本机。可设置 `$env:PORT = 4174` 更换端口。

```powershell
npm.cmd test
npm.cmd run build
```

`dist/` 是完整静态发布目录，可交给任意静态托管服务。通过 HTTP 预览，避免直接双击 HTML。项目没有在线字体、远程图片或运行时 CDN 依赖，网页不需要密钥。没有执行公开发布。

## 已实现的体验

- 108 个实例化鼓轮，5 个功能分组，前面阵列与后部接线。
- 连续拆解滑杆、拆合按钮；接线板展开时翻面，便于观察。
- 部件目录、模型拾取与跟随部件位置的编号注释，中文结构说明。
- 正面、斜视、背面，拖动旋转、滚轮缩放、缩放与复位按钮。
- 鼓轮开始/暂停示意动画；系统减少动态效果时改为立即拆合、逐步转位。
- 展品史料、来源链接、操作指南，原生 dialog 键盘行为。
- 桌面与手机布局、原生 range、焦点样式、快捷键 E / 空格 / R。

本模型为程序化教学重建。尺寸、颜色、布线、齿轮、电机和拆解路径均包含展示性简化；不执行实际密码分析，也不是可制造的工程模型。

## 代码结构与后续扩展

| 文件 | 职责 |
| --- | --- |
| `src/model.js` | 统一尺寸 DIM，部件记录 PARTS，程序化几何、实例化、拆解与运转、资源释放 |
| `src/textures.js` | 本地 Canvas 生成鼓轮刻字、金属铭牌、涂层细节 |
| `src/scene.js` | 相机、OrbitControls、环境反射、主/补/轮廓灯、阴影、响应式构图 |
| `src/main.js` | 唯一应用状态、DOM 控制、部件拾取、偏好与生命周期 |
| `index.html` / `styles.css` | 档案馆视觉、部件面板、控制台、移动布局和史料弹窗 |
| `tests/model.test.mjs` | 几何边界与数量、拆合不漂移、输入边界、暂停/复位、资源释放 |
| `QA.md` | 浏览器验收清单与结果，截图路径 |

以展示单位建模：Y 向上，+Z 为鼓轮正面，主体宽 7.6、高约 6.6、柜深 2.05；这些数值不代表原机实测米制尺寸。部件偏移每帧由原始位置计算，接线板翻转也用同一拆解进度驱动，防止反复拆合累积误差。

模型 API：`root`、`parts`、`setExplode(0…1)`、`update(dt, running)`、`resetMotion()`、`getAnchor(id)`、`dispose()`。改造新产品时保留模型与 DOM 状态边界，替换尺寸、部件记录及几何即可。静态几何只在相同部件、相同材质内合并；可分离部件保持独立。共享 GPU 资源仅释放一次。

无后处理和外部 GLB，优先确保几何、材质和操作的清晰度。浏览器只读诊断：`window.__BOMBE_INSPECT__()`；报告状态、鼓轮数量、绘制调用、三角形、纹理和相机数据，不作为产品控制接口。

## 史料依据

查阅日期：2026-10-16。仅参考事实与结构，不下载或复制博物馆图片。

- [The National Museum of Computing — Turing–Welchman Bombe](https://www.tnmoc.org/bombe)：机电破译流程、三个独立 Enigma 电路组、对角板、检查过程。
- [Crypto Museum — Bombe](https://www.cryptomuseum.com/crypto/bombe/)：三组、每组十二组三鼓轮，108 鼓轮与 36 组 Enigma 模拟特征。
- [The Rutherford Journal — The Turing Bombe](https://www.rutherfordjournal.org/article030108.html)：首台 Victory 与改进型 Agnes 的 1940 年时间线、BTM 工程制造和对角板。

建模与页面代码独立编写，没有复制 Cassette 项目代码或其媒体。Three.js 与 esbuild 版本在 package-lock.json 锁定，第三方许可见 `THIRD_PARTY_NOTICES.txt`。
