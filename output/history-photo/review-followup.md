# 影像改版复核 follow-up

日期：2026-10-17。仅定向复核上一份 `review.md` 的 P2、P3；未重新探索 CSS、素材或其他产品范围。未改产品或测试，仅新增本报告，保留原报告作为历史记录。

## P2：重复挂载 / 交叠 root 所有权 —— 已关闭

检查当前 `src/history-gallery.js` 的模块级 `galleryOwners` WeakMap、替换前旧 owner cleanup、每 gallery 独立 removers、records 删除及最后一个 record 释放后的 factory destroy。

当前明确采用“最新挂载独占 gallery”的语义，而非引用计数共享。旧 owner 在新实例采集 DOM 快照前恢复静态 DOM；旧实例后续 destroy 幂等，不会再覆盖新实例。部分 gallery 被替换时，旧 factory 的其他 gallery 继续工作；已移出的 record 不处理旧 observer 回调。最后一个 record 被替换时，旧 factory 的公共监听器和 observer 一并清理。

### 独立验证

运行：

```text
node --test --test-name-pattern="duplicate factory|replacing one gallery" tests/history-gallery.test.mjs
```

结果：**5 tests / 5 pass / 0 fail**。涵盖同 root / Document 与 gallery 交叠 root × 两种 destroy 顺序，以及替换一个 gallery 时 sibling 与 stale observer 回调。

另外直接在终端重跑上一份报告的最小 HTML、fake clock 复现（未写测试文件），扩展为四种 root/清理顺序组合，并验证第三次重新挂载：

- 二次 mount 后恰好一个 timer，不再是两个。
- 先 destroy 旧实例不影响新实例；一次 next 点击输出 `2 / 3`，不重复前进。
- 两实例销毁后 timer 为 0，`body.innerHTML` 与原静态 HTML 完全一致（全部 figure 可读、controls hidden、无增强 class 残留）。
- 后续 remount 正常；再次 destroy 已失效的旧实例不影响新 owner；最后销毁仍恢复原 DOM。

四组均 PASS，原 P2 不再复现。本次定向检查未发现该修复引入需继续保留的问题。

## P3：notices 旧肖像发布状态冲突 —— 已关闭

检查 `THIRD_PARTY_NOTICES.txt` 并用独立断言确认：

- 已删除 `A2 portrait remains pending and is not distributed.`。
- 已删除 `The Turing type composition is original layout, not an archival portrait.`。
- 当前说明明确：此前未分发的是 Elliott & Fry 候选；当前 A2 使用 `Alan Turing Aged 16.jpg`，并指向下方 adopted photographic archive。

断言 PASS。旧候选与当前采用肖像不再混淆，原 P3 已解决。

## 收束与验证范围

**上一份报告两项 finding 均已关闭；本次无新增 finding。**

本次仅独立运行上述 5 项定向回归、原复现及 remount 断言、notices 文本断言，未重跑全量或写 dist。主代理提供的 **127/127 tests / build 通过**作为协作验证结果记录，不冒充本次独立重跑结果。无需扩大审计。
