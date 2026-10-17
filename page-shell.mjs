/** Extract an explicitly owned template region, rejecting ambiguous templates. */
function region(html, name) {
  const start = `<!-- ${name}:START -->`, end = `<!-- ${name}:END -->`;
  const from = html.indexOf(start), to = html.indexOf(end);
  if (from < 0 || to < from || html.indexOf(start, from + start.length) !== -1 || html.indexOf(end, to + end.length) !== -1) {
    throw new Error(`Invalid or missing ${name} template marker`);
  }
  return { before: html.slice(0, from), content: html.slice(from + start.length, to), after: html.slice(to + end.length) };
}

/** One source of history prose, one auto entry, identical dev/build composition. */
export function renderHome({ appHtml, historyHtml }) {
  const app = region(appHtml, 'APP-SHELL');
  const history = region(historyHtml, 'HISTORY-CONTENT');
  const overlay = region(appHtml, 'SHARED-TRANSITION');
  // The transition remains a sibling of the inert application, never its child.
  return `${app.before}\n<div id="history-page" data-history-preview data-load-state="loading">${history.content}</div>\n<div id="application-shell" hidden inert>${app.content}</div>\n${overlay.content}${overlay.after}`;
}
