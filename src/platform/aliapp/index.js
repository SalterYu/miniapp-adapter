import { ProxyInvokePlatformApi, Extend } from "../../utils/index";
import * as NetWork from "./network";
console.log("invoke aliapp");
const wx = {};
const _my = typeof my !== "undefined" && my;
if (_my) {
  Extend(wx, _my);
}
Extend(wx, NetWork);

export default ProxyInvokePlatformApi(wx);
