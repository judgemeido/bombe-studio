# 首页十八节历史档案 · 2026-10-18

用户要求调用技能重做首页排版、增加历史线索，至少15个板块；随后回复“按你的方案做”。本轮使用 frontend-design 的视觉流程、writing-plans / executing-plans 的实施流程、可访问性与验证技能，完成18节、四段叙事。该版本取代此前已接受的七幕排版作为当前实现，仍待用户对新视觉效果反馈。

## 当前内容

| 节 | 锚点 | 内容与依据 |
|---|---|---|
| 01 | lifeline | 大西洋海运、通信与战争背景；S6 |
| 02 | intercept | 截收网络与整理报文；S1、S2 |
| 03 | enigma | 商用到军用、转子与信号往返；S1、S7 |
| 04 | daily-key | 每日密钥、轮序、环位与消息设置；S2、S4 |
| 05 | pioneers | 波兰三位数学家与1932年突破；S1 |
| 06 | polish-methods | 齐加尔斯基孔表、Bomba及适用条件；S1、S5 |
| 07 | handover | 1939年7月Pyry交接；S1 |
| 08 | bletchley | 布莱切利园与外设站点；S1、S5 |
| 09 | turing | 图灵的计算思想、战时工作与人物年表；S2、S3 |
| 10 | crib | 明文猜测、字母不自映射、教学对齐示例；S4、S7 |
| 11 | constraints | 菜单关系、机器搜索与候选检查；S2、S4 |
| 12 | diagonal | 韦尔奇曼的对角接线板、互易约束；S2、S4 |
| 13 | victory | 1940年3月、BTM与Harold Keen、108鼓轮；S2、S4、S5 |
| 14 | operators | WRNS、RAF与操作维护劳动；S2、S5 |
| 15 | intelligence | 停机、核验、解读与判断；S2、S4、S6 |
| 16 | naval | 1942年M4、1943年美国Bombe与合作；S1、S5 |
| 17 | legacy | 战后、2007年重建与不同机器的区别；S1、S2、S3、S5 |
| 18 | onward | 历史到三维展馆、实验和六关挑战；S2、S4 |

来源编号对应首页页脚。此次实际联网核对了 Crypto Museum 的 Enigma history、Bombe，TNMOC 的 Bombe，以及 Rutherford Journal 的 The Turing Bombe。图灵与海运资料沿用项目既有来源，不声称本轮重查所有外部链接。

Victory 日期存在来源差异：TNMOC写3月14日开始破译，Crypto Museum写3月18日交付。正文用1940年3月，注记同时保留两种说法。第10节字母串明确为教学构造，不是历史截获报文。第03节用“下一次可能不同”，因为现有Enigma算法在初始ACQ时可将连续AA编码为OO。

## 版式与实现

- 深海蓝首屏、纸色正文、铜色线索编号；四段叙事索引与18节目录。
- 桌面侧边目录随阅读停留；手机目录原生展开/收起并独立滚动，正文单栏。
- 肖像并列、信号路径、密钥条目、明文对齐、关系说明与事件年表，按内容选择布局。
- 保留2组可操作照片画廊；全部11张展示照片使用本地文件、真实尺寸、替代文字及来源图注。没有新增合成历史影像。
- `history-preview.html` 仍是正文唯一发布源，`history-preview.css` 为隔离样式；`renderHome()` 同时用于开发和生产。
- `src/routes.js` 白名单加入新锚点。历史控制器、三维模型、相机、Enigma算法和挑战逻辑未修改。
- `output/home-redesign/render.mjs`、`style.mjs`、`update-tests.mjs` 是本次一次性编写工具，不在 npm build 链中；后续直接编辑正式HTML/CSS，勿无意重跑旧工具覆盖新修正。
- 之前未提交的首页与测试已保存在 `output/home-redesign/before/`；未reset/clean、提交、推送或部署。

## 本轮实际验证

- 新测试先在7节旧页上失败：缺少11节、新锚点误路由、照片预留尺寸与图注缺失；实现后通过。
- `npm.cmd test`：**129/129通过**，见 `output/home-redesign/tests-final.txt`。
- `npm.cmd run build` 成功，见 `output/home-redesign/build-final.txt`。
- `git diff --check` 通过，仅CRLF提示。旧排版的5项实现细节断言由新语法/可读性检查取代，新增4项内容、路由、照片与教学事实回归；测试数不是同一旧用例集合。
- 浏览器：1440×900桌面、390×844手机、320×568窄屏、768×1024平板均读取页面宽度，未见水平溢出。实际查看桌面首屏/人物与手机首屏/明文示例/收尾。
- 手机逐节点击目录，18节目标保持history路由并更新活动项；17个中后段的记录见 `mobile-navigation.json`，第01节另外实际点击。
- 从末节进入整机、信号实验室、六关挑战均实际显示对应页面；整机返回后点击新naval锚点仍留在历史页。未做三维全功能回归。
- 两次实际操作Bombe画廊：下一张显示重建鼓轮，上一张返回战时照片；目录键盘Enter可收起/展开。
- 独立审阅发现并修复两项：Enigma输出必变的不准确标题、深色summary焦点对比。浏览器读取修正后outline为rgb(182,154,103)，背景rgb(20,38,51)，并确认焦点进入控件。其余无重要审阅发现。
- 首图预留尺寸与实际尺寸一致：1200×941；所有照片已读取本地文件真实尺寸后写入HTML。
- 最终页面控制台warn/error抽查为空。

截图：`desktop-cover.jpg`、`desktop-people.jpg`、`mobile-cover.jpg`、`mobile-crib.jpg`，均位于 `output/home-redesign/`。照片加载、断网替代和减少动态的控制器测试仍通过；本轮未做真实屏幕阅读器、真机GPU性能或全浏览器认证。
