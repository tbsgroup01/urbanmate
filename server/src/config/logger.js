module.exports = {
  info: () => {},
  debug: () => {},
  warn: () => {},
  error: (obj, msg) => {
    if (typeof obj === 'string') console.error(obj);
    else if (msg) console.error(`[Error] ${msg}:`, obj?.err?.message || obj?.message || '');
  },
  fatal: (obj, msg) => {
    console.error(`[Fatal] ${msg || ''}:`, obj?.err?.message || obj?.message || '');
  }
};
