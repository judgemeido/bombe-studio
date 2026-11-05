export const ROGUE_ROLES = Object.freeze([
  { id: 'intercept', name: '截收员', ability: '开局多一条频道记录', effect: 'channel-evidence' },
  { id: 'archive', name: '档案助理', ability: '预览下一层并重抽一次路线', effect: 'route-reroll' },
  { id: 'mechanic', name: '机修学徒', ability: '一次免除设置错误的余裕损失', effect: 'repair-mistake' },
]);

export const ROGUE_EVENTS = Object.freeze([
  [
    { type: 'signal', zone: 'radio', title: '回声里的呼号', reward: '来源线索' },
    { type: 'dispatch', zone: 'radio', title: '被雨打湿的抄报', reward: '备用纸带' },
    { type: 'colleague', zone: 'radio', title: '隔壁台的值守员', reward: '频道线索' },
  ],
  [
    { type: 'archive', zone: 'archive', title: '旧班记录', reward: '词形线索' },
    { type: 'colleague', zone: 'archive', title: '档案室的夜灯', reward: '提示工具' },
    { type: 'tea', zone: 'archive', title: '短暂的茶歇', reward: '恢复余裕' },
  ],
  [
    { type: 'analysis', zone: 'analysis', title: '红铅笔留下的圈注', reward: '密码约束' },
    { type: 'wire', zone: 'machine', title: '工作台上的接线卡', reward: '接线记录' },
    { type: 'colleague', zone: 'analysis', title: '分析员的便笺', reward: '提示工具' },
  ],
  [
    { type: 'settings', zone: 'machine', title: '未封存的设置单', reward: '核验条件' },
    { type: 'machine', zone: 'machine', title: '停机灯箱', reward: '候选提示' },
    { type: 'tea', zone: 'machine', title: '机房的保温壶', reward: '恢复余裕' },
  ],
]);

export const ROGUE_ZONE_LABELS = Object.freeze({
  radio: '无线电室', archive: '档案走廊', analysis: '分析室', machine: '机房',
});

export const ROGUE_CASES = Object.freeze([
  { id: 'weather', plaintext: 'WETTER', label: '天气截报' },
  { id: 'harbor', plaintext: 'NORDHAFEN', label: '北港航讯' },
  { id: 'passage', plaintext: 'FREI', label: '通行信号' },
  { id: 'morning', plaintext: 'MORGEN', label: '晨间报头' },
  { id: 'fog', plaintext: 'NEBEL', label: '雾况记录' },
  { id: 'signal', plaintext: 'SIGNAL', label: '信号报头' },
]);
