// ==UserScript==
// @name         Kindle Library Downloader
// @namespace    http://tampermonkey.net/
// @version      2025-02-22
// @description  Download your Kindle library to your computer
// @author       MakeFunStuff
// @match        https://www.amazon.com/*/digital-console/contentlist/booksAll/*
// @match        https://www.amazon.in/*/digital-console/contentlist/booksAll/*
// @match        https://www.amazon.com/*/*/digital-console/contentlist/booksAll/*
// @match        https://www.amazon.co.uk/*/digital-console/contentlist/booksAll/*
// @match        https://www.amazon.co.uk/*/*/digital-console/contentlist/booksAll/*
// @match        https://www.amazon.ca/*/digital-console/contentlist/booksAll/*
// @match        https://www.amazon.ca/*/*/digital-console/contentlist/booksAll/*
// @match        https://www.amazon.de/*/digital-console/contentlist/booksAll/*
// @match        https://www.amazon.de/*/*/digital-console/contentlist/booksAll/*
// @match        https://www.amazon.co.jp/*/digital-console/contentlist/booksAll/*
// @match        https://www.amazon.co.jp/*/*/digital-console/contentlist/booksAll/*
// @match        https://www.amazon.com.au/*/digital-console/contentlist/booksAll/*
// @match        https://www.amazon.com.au/*/*/digital-console/contentlist/booksAll/*
// @match        https://www.amazon.com.br/*/digital-console/contentlist/booksAll/*
// @match        https://www.amazon.com.br/*/*/digital-console/contentlist/booksAll/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amazon.com
// @grant        none
// @downloadURL  https://github.com/Make-Fun-Stuff/kindle-library-downloader/raw/refs/heads/main/kindle-library-downloader.user.js
// @updateURL  https://github.com/Make-Fun-Stuff/kindle-library-downloader/raw/refs/heads/main/kindle-library-downloader.user.js
// ==/UserScript==

const TEST_MODE = false; // turn on to download a single book from the current page (for testing)
const DRY_RUN = false; // turn on to do everything other than actually download the books

const DELAY_BETWEEN_BOOKS_SECONDS = 10;
const BUTTON_ID = "download-lib-button";
const INPUT_ID = "download-lib-input";
const COOKIE_NAME = "downloader-device-name";

const log = (msg) => {
  console.log(`[LIB_DOWNLOADER] ${msg}`);
};

const getCookieValue = (name) => {
  const cookie =
    document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)")?.pop() ||
    undefined;
  log(`Cookie: ${cookie}`);
  return cookie;
};

const clickBackground = () => {
  Array.from(
    document.querySelectorAll('[class*="DeviceDialogBox-module_backdrop"]')
  ).forEach((_) => _.click());
};

const getTitleButtons = () => {
  return [
    ...document.querySelectorAll('[id="MORE_ACTION:false"]'),
    ...document.querySelectorAll("#mobile-content-see-more-actions"),
  ];
};

const waitUntil = async (condFn) => {
  return new Promise((resolve) => {
    const intervalId = setInterval(() => {
      if (condFn()) {
        clearInterval(intervalId);
        resolve();
      }
    }, 250);
  });
};

const waitUntilElement = async (selectorFn, timeout, timeoutMsg) => {
  const CHECK_TIME = 250;
  var time = 0;
  const tout = timeout || 5000;
  return new Promise((resolve, reject) => {
    const intervalId = setInterval(() => {
      const val = selectorFn();
      if (time > tout) {
        clearInterval(intervalId);
        const msg = timeoutMsg || "Timeout! Something went wrong :(";
        log(msg);
        // window.alert(msg);
        reject();
      }
      if (!!val) {
        clearInterval(intervalId);
        resolve(val);
      }
      time += CHECK_TIME;
    }, CHECK_TIME);
  });
};

const countdown = async (numSecs) => {
  var time = numSecs;
  return new Promise((resolve, reject) => {
    const intervalId = setInterval(() => {
      const button = document.querySelector(`#${BUTTON_ID}`);
      if (time <= 0) {
        if (button) {
          button.textContent = "Download All";
        }
        clearInterval(intervalId);
        resolve();
      }
      if (button) {
        button.textContent = `Waiting (${time})`;
      }
      log(time);
      time -= 1;
    }, 1000);
  });
};

const getBookTitle = (index) => {
  const allTitles = Array.from(
    document.querySelectorAll(".digital_entity_title")
  );
  if (!allTitles || allTitles.length <= index || !allTitles[index]) {
    return "Unknown title";
  }
  return allTitles[index].innerText;
};

const getInputValue = () => {
  const input = document.querySelector(`#${INPUT_ID}`);
  if (input && input.value && input.value.trim().length) {
    return input.value.trim().toLowerCase();
  }
  const cookie = getCookieValue(COOKIE_NAME);
  if (cookie && cookie.trim().length) {
    return cookie.trim().toLowerCase();
  }
  return undefined;
};

const downloadBook = async (index) => {
  const title = getBookTitle(index);
  log(`Downloading ${title}`);
  log('Clicking "More Actions"');
  getTitleButtons()[index].click();
  log("Waiting for dropdown");
  await waitUntilElement(
    () =>
      document.querySelectorAll("[class*=Dropdown-module_dropdown_container]")[
        index
      ]
  );
  log("Choosing dropdown option");
  const option = Array.from(
    document
      .querySelectorAll("[class*=Dropdown-module_dropdown_container]")
      [index].querySelectorAll("span")
  ).find((_) => _.innerText.includes("Download & transfer"));
  if (!option) {
    log(`Skipping "${title}," probably because it's Kindle Unlimited`);
    document.querySelector(".body-inner").click(); // click outside the dropdown to close it
    return false;
  }
  option.click();

  const inputVal = getInputValue();
  if (inputVal) {
    log(`[Input] Looking for device with a name containing: ${inputVal}`);
  } else {
    log(`[Input] No input value provided, selecting first device`);
  }
  let radioButton = undefined;
  try {
    if (!inputVal) {
      radioButton = await waitUntilElement(
        () =>
          document
            .querySelectorAll("[class*=Dropdown-module_dropdown_container]")
            [index].querySelector("[class*=RadioButton]"),
        5000,
        "Could not select a Kindle. You need a device registered to your account, though this download process won't actually download anything to that device."
      );
    } else {
      const allOpts = Array.from(
        await waitUntilElement(() =>
          document
            .querySelectorAll("[class*=Dropdown-module_dropdown_container]")
            [index].querySelectorAll(
              "[class*=ActionList-module_action_list_item]"
            )
        )
      );
      log(
        `Found device options: ${allOpts.map((_) => _.innerText).join(", ")}`
      );
      const matchingOpt = allOpts.find((_) =>
        _.innerText.toLowerCase().includes(inputVal)
      );
      radioButton = matchingOpt.querySelector("[class*=RadioButton]");
    }
  } catch (ex) {
    log(ex);
  }
  if (!radioButton) {
    log("Could not download this book, skipping");
    clickBackground();
    return false;
  }
  radioButton.click();
  log("Clicking download");
  const downloadButton = await waitUntilElement(() =>
    document.querySelector(
      "[id*='DOWNLOAD_AND_TRANSFER_DIALOG'] [class*=DeviceDialogBox-module_container__] [id*='CONFIRM']"
    )
  );
  if (!DRY_RUN) {
    downloadButton.click();

    log("Closing popup");
    const closeButton = await waitUntilElement(() =>
      document.querySelector("[class*=Notification-module_close]")
    );
    closeButton.click();
  } else {
    const closeButton = await waitUntilElement(() =>
      document
        .querySelectorAll("[id*=DOWNLOAD_AND_TRANSFER_DIALOG]")
        [index].querySelector("[class*=DeviceDialogBox-module_close]")
    );
    closeButton.click();
  }
  log("Waiting before moving on so Amazon doesn't get mad...");
  await countdown(DRY_RUN ? 0 : DELAY_BETWEEN_BOOKS_SECONDS);
  return true;
};

const downloadCurrentPage = async () => {
  if (TEST_MODE) {
    await downloadBook(1);
    log("Ending after one book (TEST MODE)");
    return;
  }
  let count = 0;
  for (const bookIndex of [...Array(getTitleButtons().length).keys()]) {
    log(`Downloading book ${count + 1} on this page`);
    const valid = await downloadBook(bookIndex);
    if (valid) {
      count += 1;
    }
  }
  return count;
};

const getCurrentPageNum = () =>
  document.querySelector(".page-item.active").innerText;

const downloadAllPages = async () => {
  if (TEST_MODE) {
    await downloadCurrentPage();
    log("Ending after one page (TEST MODE)");
    return;
  }
  const startPageIndex = parseInt(getCurrentPageNum()) - 1;
  const pageSelectors = document.querySelectorAll(".pagination .page-item");
  const numPages = parseInt(pageSelectors[pageSelectors.length - 1].text);
  log(`Downloading all ${numPages} pages, starting from ${startPageIndex + 1}`);
  let count = 0;
  for (const curPageIndex of [...Array(numPages - startPageIndex).keys()]) {
    const curPage = startPageIndex + curPageIndex + 1;
    log(`Clicking on page selector (index ${curPage})`);
    await waitUntil(() => !!document.querySelector(`#page-${curPage}`));
    document.querySelector(`#page-${curPage}`).click();
    log(`Making sure we're on the right page and books have loaded`);
    await waitUntil(
      () =>
        parseInt(getCurrentPageNum()) === curPage &&
        getTitleButtons().length > 0
    );
    log(`Downloading page ${curPage}`);
    const numPageBooks = await downloadCurrentPage();
    log(`Downloaded all ${numPageBooks} titles on this page`);
    count += numPageBooks;
  }
  log(`All ${count} books have been downloaded!`);
  window.alert(`All ${count} books have been downloaded!`);
};

const setup = () => {
  log('Adding "Download All" button & input field');
  const container = document.querySelector("#CONTENT_TASK_BAR");
  // text input
  const inputContainer = document.createElement("div");
  inputContainer.style.marginTop = "10px";
  inputContainer.style.marginBottom = "10px";
  const input = document.createElement("input");
  input.type = "text";
  input.id = INPUT_ID;
  const cookieVal = getCookieValue(COOKIE_NAME);
  if (!!cookieVal) {
    input.value = cookieVal;
  } else {
    log("Could not set value from cookie");
  }
  input.onchange = (ev) => {
    document.cookie = `${COOKIE_NAME}=${ev.target.value}`;
  };
  // button
  const button = document.createElement("button");
  button.id = BUTTON_ID;
  button.textContent = "Download All";
  button.setAttribute("class", "action_button");
  button.onclick = async () => {
    button.setAttribute("disabled", true);
    input.setAttribute("disabled", true);
    await downloadAllPages();
  };
  container.appendChild(button);
  inputContainer.appendChild(
    document.createTextNode(" Optionally specify device name: ")
  );
  inputContainer.appendChild(input);
  container.appendChild(inputContainer);
  // shameless plug
  const bmacButton = document.createElement("button");
  bmacButton.style.border = "none";
  bmacButton.onclick = () => {
    log("Thank you!!");
    window.open("https://www.buymeacoffee.com/MakeFunStuff", "_blank");
  };
  bmacButton.innerHTML =
    '<img width="150px" src="https://www.owlstown.com/assets/icons/bmc-yellow-button-e91f626c5320efe1868dd75673b6edae7d0e2e4f059d40cd3287a7c8536805e6.png" />';
  container.appendChild(bmacButton);
};

(function () {
  "use strict";
  log("Waiting for page to finish loading...");
  waitUntil(() => getTitleButtons().length > 0).then(setup);
})();
