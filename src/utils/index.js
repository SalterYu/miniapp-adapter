export function ProxyInvokePlatformApi(wx) {
  if (typeof Proxy !== "undefined") {
    const _wx = wx;
    wx = new Proxy(
      {},
      {
        get(target, key, receiver) {
          if (_wx[key]) return _wx[key];

          // almost all wx[key] is a function
          return () => {
            console.warn(`invoke wx.${key}, but not achieve function`);
          };
        },
        set(target, key, value) {
          _wx[key] = value;
        }
      }
    );
  }
  return wx;
}

export function Extend(obj, newObj) {
  return Object.assign(obj, newObj);
}
