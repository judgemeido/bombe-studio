# P3 Task2 定向复核

日期：2026-10-17

## 结论

**原 3 个 findings 均已解决，本次定向复核通过；未发现这些修复引入的新增问题。**

范围仅限上次报告的三个问题、对应 bootstrap 修改和新增测试；未复评 main 或扩大为完整浏览器/集成验收。本次只新增此报告，未修改产品或测试文件。

## 逐项核验

| 原问题 | 结果 | 实现及测试证据 |
|---|---|---|
| P2：返回历史后旧 import 拒绝重新弹出错误遮罩 | 已解决 | `src/bootstrap.js:64-72` 仍清除失败缓存，但仅当最新 desired 非 history 且未 dispose/suspend 时显示错误；`tests/bootstrap.test.mjs:47-63` 分别覆盖显式 history 与原生 `#sources`，断言历史可见、overlay 隐藏、aria-busy 清除、工厂未创建、hash 保留，并验证随后可重新加载及创建工厂。 |
| P2：lab→history→challenge 复用 pending import 时丢失 loading UI | 已解决 | `src/bootstrap.js:43-53` 将最新请求的 loading UI 更新放在 loading guard 前，既恢复 overlay/aria-busy，又不重复发起 import；`tests/bootstrap.test.mjs:65-81` 在 Promise 尚未完成时检查中间态、最新章节元数据、loads=1，并在完成后验证工厂只创建一次且 initialRoute=challenge，最终清除 overlay/aria-busy。 |
| P3：首次交互加载的 overlay 仍显示静态 02 元数据 | 已解决 | `src/bootstrap.js:5-10,45-48` 使用轻量元数据同步写入 title/chapter，无新增 main 静态依赖；`tests/bootstrap.test.mjs:83-92` 覆盖初始 challenge、旧 `#/` exhibit，前述共享 import 测试还覆盖 pending 中改为 challenge。当前文案与 navigation 的章节元数据一致。 |

## 新测试质量与边界

- 新增共 6 项（2 个 stale-rejection 变体、1 个共享加载、2 个初始元数据、1 个当前有效请求失败）。覆盖原三个复现条件，不仅检查最终页面，也检查 pending 中间态和 aria-busy/overlay。
- `tests/bootstrap.test.mjs:94-102` 额外确认 lab→history→challenge 后共享 import 的拒绝仍会为最新交互请求显示错误，避免通过一律忽略旧 import 失败来“修复”历史遮罩问题。
- 初始元数据测试刻意不 resolve deferred，验证结果确实发生于工厂执行之前；清理通过既有 fixture 的 dispose 完成。
- bootstrap 的本地轻量元数据副本有未来文案同步成本，但已有对齐注释，当前一致；不作为本次阻断项。
- 这是源码检查及 happy-dom 可控 Promise 回归验证，不是实际浏览器网络或 bfcache 集成验收。

## 独立执行结果

命令：

```text
node --test tests/bootstrap.test.mjs tests/navigation.test.mjs
```

结果：**18 passed / 0 failed / 0 skipped**（bootstrap 14 项、navigation 4 项）。包括原 12 项和新增 6 项。本次未重跑修复报告声称的 npm test 102 项，故不独立背书该全量计数。
