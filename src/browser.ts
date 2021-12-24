import {Message, Options} from "./types";

export type BrowserObject = FirefoxObject | ChromeObject;

export type StorageDiff<T> = {
  [K in keyof T]+?: {
    newValue: T[K];
  };
};

export declare interface FirefoxObject {
  runtime: {
    sendMessage: (msg: Message) => Promise<any>;
    onMessage: {
      addListener: (f: Function) => void;
    };
    openOptionsPage: () => void;
  };
  storage: {
    local: {
      get: (o: string[] | object) => Promise<Options | {}>;
      set: (o: object) => Promise<void>;
    };
    onChanged: {
      addListener: (f: (o: StorageDiff<Options>) => void) => void;
    };
  };
  tabs: {
    query: (o: object) => Promise<Tab[]>;
    remove: (i: number) => void;
    update: (i: number, o: object) => void;
  };
}

export declare interface ChromeObject {
  runtime: {
    sendMessage: (msg: Message, fn?: (o: any) => void) => void;
    onMessage: {
      addListener: (f: Function) => void;
    };
    openOptionsPage: () => void;
    lastError: any;
  };
  storage: {
    local: {
      get: (o: string[] | object, fn: (s: Options | {}) => void) => void;
      set: (o: object, fn: () => void) => void;
    };
    onChanged: {
      addListener: (f: (o: StorageDiff<Options>) => void) => void;
    };
  };
  tabs: {
    query: (o: object, fn: (r: Tab[]) => void) => void;
    remove: (i: number) => void;
    update: (i: number, o: object) => void;
  };
}

export declare interface Tab {
  id: number;
  pinned: boolean;
  windowId: number;
}

export declare interface Sender {
  tab: Tab;
}

declare let browser: BrowserObject;
declare let chrome: ChromeObject;

export function isFirefox(env: BrowserObject): env is FirefoxObject {
  return !isChrome(env);
}

export function isChrome(env: BrowserObject): env is ChromeObject {
  return typeof browser === "undefined";
}

export function getBrowserObject(): BrowserObject {
  if (typeof browser === "undefined") {
    return chrome;
  } else {
    return browser;
  }
}
