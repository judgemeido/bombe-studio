/** A lazy, retryable resource transaction. Call check() after every async boundary. */
export function createExhibitRuntime(initialize) {
  let pending = null, disposed = false;
  const resources = [];
  const check = () => { if (disposed) throw new Error('Exhibit runtime disposed'); };
  function release(resource) { if (typeof resource === 'function') resource(); else resource?.dispose(); }
  function cleanup() {
    for (const resource of resources.splice(0).reverse()) {
      try { release(resource); } catch { /* Continue releasing the remaining resources. */ }
    }
  }
  function own(resource) {
    if (disposed) { release(resource); check(); }
    resources.push(resource); return resource;
  }
  return {
    ensure() {
      if (disposed) return Promise.reject(new Error('Exhibit runtime disposed'));
      if (!pending) pending = Promise.resolve().then(() => {
        check(); return initialize({ own, check });
      }).then(value => { check(); return value; }).catch(error => {
        cleanup(); pending = null; throw error;
      });
      return pending;
    },
    dispose() { if (disposed) return; disposed = true; cleanup(); },
  };
}
