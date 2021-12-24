import {Options} from "./types";
import {getBrowserObject, isFirefox, StorageDiff} from "./browser";
import {getLocalStorage} from "./storage";

//
// MousePager content script
//

const MB_PRIM = 0;
const MB_MID = 1;

const MB_DEP_PRIM = 1;
const MB_DEP_MID = 4;

let pagerOptions: {[k: string]: boolean};
let browser = getBrowserObject();

// Used to detect double-clicks usingm middle button.
let mbClicks = 0;

// Given an element, find the closest parent which has a vertical scrollbar.
function getVScrolledParent(el: Element | null) {
  while (el) {
    if (el.scrollHeight !== el.clientHeight) {
      return el;
    }
    el = el.parentElement;
  }
}

// Given an element, find the closest parent which has a horizontal scrollbar.
function getHScrolledParent(el: Element | null) {
  while (el) {
    if (el.scrollWidth !== el.clientWidth) {
      return el;
    }
    el = el.parentElement;
  }
}

// Scroll 90% of the page up/down when scroll wheel is turned up or down while
// keeping primary button pressed.
document.addEventListener(
  "wheel",
  ev => {
    if (ev.buttons === MB_DEP_PRIM) {
      // Scroll with primary button depressed
      if (!pagerOptions["prim+scroll"]) {
        return;
      }

      let el = getVScrolledParent(ev.target as Element);
      if (!el) {
        return;
      }

      let mult = ev.deltaY > 0 ? 1 : -1;

      // Scroll the window first. For most pages, this will do. However, for pages
      // where a wrapper occupies the whole window, and an inner element is
      // scrolled, scrolling the window doesn't have any effect. So we check
      // whether scrolling the window had any effect. If not, we try to scroll
      // that specific element.
      let topBefore = el && el.scrollTop;
      window.scrollBy(0, window.innerHeight * 0.9 * mult);
      let topAfter = el && el.scrollTop;

      if (topBefore === topAfter && el) {
        console.log("Scrolling element " + el.nodeName + " directly");
        el.scrollTop = el.scrollTop + el.clientHeight * 0.9 * mult;
      }
    } else if (ev.buttons === (MB_DEP_PRIM | MB_DEP_MID)) {
      // Scroll with primary and middle buttons depressed

      if (!pagerOptions["prim+middle+scroll"]) return;

      if (ev.deltaY > 0) {
        // Bottom of the page
        window.scrollTo(
          0,
          Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
          )
        );
      } else {
        // Bottom top of the page
        window.scrollTo(0, 0);
      }
    } else if (ev.buttons === MB_DEP_MID) {
      // Scroll with middle button depressed
      if (!pagerOptions["middle+scroll"]) return;

      if (ev.deltaY > 0) {
        browser.runtime.sendMessage("shownext");
      } else {
        browser.runtime.sendMessage("showprev");
      }
    } else if (ev.shiftKey) {
      // Scroll with shift key pressed
      if (!pagerOptions["shift+scroll"]) return;

      // Scroll the element horizontally
      let el = getHScrolledParent(ev.target as Element);
      if (el) {
        el.scrollLeft = el.scrollLeft + ev.deltaY * 15;
      }
    } else {
      return;
    }

    if (pagerOptions["clearselection"]) {
      let sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
      }
    }

    ev.preventDefault();
    ev.stopPropagation();
  },
  {passive: false}
);

document.addEventListener(
  "auxclick",
  ev => {
    // Double-click with middle button

    if (!pagerOptions["middle+dblclick"]) {
      return;
    }

    if (ev.button === MB_MID) {
      mbClicks++;
    }

    // If we receive another click soon enough, we register as a double-click.
    setTimeout(() => (mbClicks = 0), 300);

    if (mbClicks === 2) {
      browser.runtime.sendMessage("closeme");
      mbClicks = 0;
    }
  },
  {passive: false}
);

// Register listener to storage change
browser.storage.onChanged.addListener((changes: StorageDiff<Options>) => {
  if (changes["options"]) {
    pagerOptions = changes["options"].newValue;
  }
});

// Read options
getLocalStorage(["options"]).then(obj => {
  pagerOptions = (obj as Options)["options"];
});
