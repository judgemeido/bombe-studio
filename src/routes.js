const historyAnchors = new Set(['lifeline', 'intercept', 'pioneers', 'turing', 'constraints', 'intelligence', 'onward', 'lifeline-context', 'sources']);

/** Parse only supported routes; ordinary history anchors never enter the app. */
export function parseRoute(hash = '') {
  let page = 'exhibit', topic = 'drums';
  if (!hash || hash === '#/history' || historyAnchors.has(hash.slice(1))) page = 'history';
  else if (hash === '#/challenge') page = 'challenge';
  else if (hash === '#/lab' || hash === '#/lab/drums' || hash === '#/lab/wiring') {
    page = 'lab';
    if (hash === '#/lab/wiring') topic = 'wiring';
  }
  return { page, topic };
}

export function routeKey(route) {
  if (route.page === 'history') return '#/history';
  if (route.page === 'challenge') return '#/challenge';
  if (route.page === 'lab') return `#/lab/${route.topic === 'wiring' ? 'wiring' : 'drums'}`;
  return '#/';
}
