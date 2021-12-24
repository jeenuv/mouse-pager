import {getBrowserObject, isFirefox, Tab, Sender} from "./browser";
import {Message, Options} from "./types";
import {getLocalStorage} from "./storage";

//
// MousePager background page
//

let browser = getBrowserObject();

function queryTabs(query: object): Promise<Tab[]> {
  if (isFirefox(browser)) {
    return browser.tabs.query(query);
  }

  let chromeRes: (r: Tab[]) => void;
  let chromePromise = new Promise<Tab[]>((res, rej) => {
    chromeRes = res;
  });

  browser.tabs.query(query, result => {
    chromeRes(result);
  });

  return chromePromise;
}

// Chrome's message handler closes the port as soon as the handler return a
// value. If this were an async function, it'll always return promise object. To
// prevent that, this is written as a normal function, and .then/.catch are used
// at the top-level instead.
browser.runtime.onMessage.addListener((message: Message, sender: Sender) => {
  switch (message) {
    case "closeme": {
      // Refuse to close a pinned tab
      if (sender.tab.pinned) {
        return;
      }

      // Query all tabs
      queryTabs({}).then(function (allTabs) {
        // Refuse to close the last remaining browser window
        if (allTabs.length === 1) {
          return;
        }

        // Shoot the messenger!
        browser.tabs.remove(sender.tab.id);
      });
      break;
    }

    case "shownext":
    case "showprev": {
      // Query all tabs in the sender's window
      queryTabs({windowId: sender.tab.windowId}).then(tabs => {
        // If there's only one tab, do nothing.
        if (tabs.length === 1) {
          return;
        }

        // Locate sender within its window
        for (let idx in tabs) {
          if (sender.tab.id !== tabs[idx].id) {
            continue;
          }

          let senderIdx = parseInt(idx);
          let candidate;
          if (message === "shownext") {
            candidate = senderIdx + 1;
            if (candidate >= tabs.length) {
              candidate = 0;
            }
          } else {
            candidate = senderIdx - 1;
            if (candidate < 0) {
              candidate = tabs.length - 1;
            }
          }

          // Make the chosen tab active on the sender's window
          browser.tabs.update(tabs[candidate].id, {active: true});
          return;
        }
      });
      break;
    }
  }
});

// Force a set of valid options by opening options page
getLocalStorage(["options"]).then(obj => {
  if (Object.keys(obj).length == 0) {
    browser.runtime.openOptionsPage();
  }
});

// vim:set tw=80:
