import {getLocalStorage, setLocalStorage} from "./storage";
import {getBrowserObject} from "./browser";
import {Options} from "./types";

//
// MousePager options page script
//

let browser = getBrowserObject();

let defaultOptions: {[k: string]: boolean} = {
  "prim+scroll": true,
  "prim+middle+scroll": true,
  "middle+scroll": true,
  "middle+dblclick": true,
  "shift+scroll": true,
  clearselection: false,
};

// Returns a promise that always fulfills with a valid set of options
async function readOptions() {
  try {
    let obj = await getLocalStorage(["options"]);

    // Returns an empty object the first time
    if (Object.keys(obj).length == 0) {
      // Write default options if there was nothing stored before
      setLocalStorage({"options": defaultOptions});
      return defaultOptions;
    } else {
      return (obj as Options)["options"];
    }
  } catch (e) {
    console.error("Error getting options");
    return {};
  }
}

// Get the value of a key from the options page
function getValueOf(key: string) {
  let el = document.getElementById(key) as HTMLInputElement;
  return el ? el.checked : false;
}

// Set the value of a key on the options page
function setValueOf(key: string, value: boolean | string) {
  let el = document.getElementById(key) as HTMLInputElement;

  if (!el) {
    console.error("couldn't find this key: " + key);
    return;
  } else if (el.getAttribute("type") === "checkbox") {
    el.checked = value as boolean;
  } else {
    el.value = value as string;
  }
}

// Populate all keys on the options page after validating them
function fillOptions(options: {[k: string]: boolean}) {
  Object.keys(defaultOptions).forEach((key: string) => {
    setValueOf(key, options[key]);
  });
}

// Click handler for save button
function onSaveClick() {
  let options: {[k: string]: boolean} = {};

  Object.keys(defaultOptions).forEach((key: string) => {
    options[key] = getValueOf(key);
  });

  setLocalStorage({"options": options});

  let confirmation = document.querySelector("#save-confirmation")! as HTMLElement;
  confirmation.style.visibility = "visible";
  setTimeout(() => (confirmation.style.visibility = "hidden"), 2000);
}

// Options page load handler
window.addEventListener("load", async () => {
  // Set individual values in the options page
  let o = await readOptions();
  fillOptions(o);

  document.getElementById("save")?.addEventListener("click", onSaveClick);
});
