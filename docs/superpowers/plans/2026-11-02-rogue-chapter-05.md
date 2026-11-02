# 05 随机夜班主章节 Implementation Plan

**Goal:** 将随机夜班从 04 的弹窗旁路提升为独立的 05 主章节，并让它成为导航和主代码入口。

**Architecture:** 复用 `rogue-engine.js` 的纯状态机、案件生成和 `rogue-template.js` 的事件视图；新增独立 `rogue` 路由、页面根节点和 lazy runtime。04 仅保留指向 05 的链接，主线状态不再创建肉鸽 overlay。

**Tech Stack:** 原生 ES modules、现有导航/延迟加载、Three.js 场景区域回调、现有档案视觉 CSS；不增加运行时依赖。

## Decisions

- URL：`#/rogue`。
- 导航标签：`05 随机夜班`，英文标识 `ROGUELITE NIGHT SHIFT`。
- 页面布局：战时档案控制台，深海蓝页背景、纸白任务面板、铜色路径和高对比动作按钮；移动端路线折叠为当前层。
- 04 的原“随机夜班 / 另起一局”按钮改为普通 `data-page="rogue"` 链接。
- 复用同一套 seed、岗位、四层路线、Enigma 核验和本地档案逻辑。

## Tasks

- [ ] Add `rogue` to route parsing, route keys, chapter metadata, loading metadata, scroll state and page navigation.
- [ ] Add the sixth navigation item and `#rogue-page` root; link 04 to it.
- [ ] Add lazy `createRogue` runtime and make the existing controller render as a standalone page shell.
- [ ] Remove the 04-owned rogue overlay and its lifecycle coupling.
- [ ] Style the standalone 05 page as the primary route while preserving overlay selector compatibility in tests.
- [ ] Add route, DOM, lifecycle and shell tests; run the full suite and build.
