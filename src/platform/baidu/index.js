import { ProxyInvokePlatformApi, Extend } from "../../utils/index";

const wx = {};
const _swan = typeof swan !== "undefined" && swan;

if (_swan) {
  Extend(wx, _swan);
}

console.log('invoke baidu')

export default ProxyInvokePlatformApi(wx)