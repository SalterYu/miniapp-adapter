console.log("invoke h5");
let wx = {};

// for debugger
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
      }
    }
  );
}

export default wx;
