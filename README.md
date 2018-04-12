# miniapp-adapter

适配基于微信小程序[(文档)](https://developers.weixin.qq.com/miniprogram/dev/api/)
适配不同小程序 API

* 微信小程序(wechat) [default]
* 支付宝小程序(aliapp) [TODO]
* 百度小程序(baidu) [TODO]

## INSTALL

```bash
yarn add --dev miniapp-adapter
```

## USAGE

基于 webpack alias

```js
// webpack.config.js
const requireAdapter = require('miniapp-adapter').default

module.exports = {
  resolve: {
    alias: {
      wx: requireAdapter('wechat') // aliapp
    }
  }
}
```
