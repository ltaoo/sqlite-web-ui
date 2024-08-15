import { request_factory } from "@/domains/request/utils";
import { Result } from "@/domains/result/index";

/**
 * 域名 https://subtitle.funzm.com
 */
export const request = request_factory({
  hostnames: {
    dev: "/",
    test: "/",
    prod: "/",
  },
  process<T>(r: Result<{ code: number | string; msg: string; data: T }>) {
    if (r.error) {
      return Result.Err(r.error.message);
    }
    const { code, msg, data } = r.data;
    if (code !== 0) {
      return Result.Err(msg, code, data);
    }
    return Result.Ok(data);
  },
});
