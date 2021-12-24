import {Options} from "./types";
import {getBrowserObject, isFirefox, isChrome} from "./browser";

let browser = getBrowserObject();

export function getLocalStorage(
  args: string[] | object
): Promise<Options | {}> {
  if (isFirefox(browser)) {
    return browser.storage.local.get(args);
  }

  let chromeRes: (o: Options | {}) => void;
  let chromePromise = new Promise<Options | {}>((res, rej) => {
    chromeRes = res;
  });

  browser.storage.local.get(args, res => {
    chromeRes(res);
  });

  return chromePromise;
}

export function setLocalStorage(args: object): Promise<void> {
  if (isFirefox(browser)) {
    return browser.storage.local.set(args);
  }

  let chromeRes: (o?: void) => void;
  let chromeRej: (o: void) => void;
  let chromePromise = new Promise<void>((res, rej) => {
    chromeRes = res;
    chromeRej = rej;
  });

  browser.storage.local.set(args, () => {
    if (isChrome(browser)) {
      if (browser.runtime.lastError) {
        chromeRej();
      } else {
        chromeRes();
      }
    }
  });

  return chromePromise;
}
