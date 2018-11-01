import { ProxyInvokePlatformApi, Extend } from "../../utils/index";
import * as NetWork from "./network";
console.log("invoke aliapp");
const api = {};
const _my = typeof my !== "undefined" && my;
if (_my) {
  Extend(api, _my);
}
Extend(api, NetWork);

export default ProxyInvokePlatformApi(api);
