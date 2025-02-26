## Prerequisites

- Currently this only works on the Amazon sites in these countries: US, UK, CA, DE, AU, JP, BR
- You must have at least one Kindle device linked to your account (this device is not used in the process of this script, but Amazon won't let you download anything if you don't have a device).
- I've only tested this in Chrome. It should work in any browser that supports TamperMonkey, but I can't promise anything.

## How to Use

- [Install TamperMonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en) in your browser if you don't have it already
- If you're using Chrome: turn on Developer Mode if you haven't already (go to chrome://extensions in your browser)
  - TamperMonkey's link about this: https://www.tampermonkey.net/faq.php#Q209
- [Click here](https://github.com/Make-Fun-Stuff/kindle-library-downloader/raw/refs/heads/main/kindle-library-downloader.user.js) to install the script
- Log in to your Amazon account
- Navigate to the "All Books" page of the "Digital Content" section of your Amazon account. [This link](https://www.amazon.com/hz/mycd/digital-console/contentlist/booksAll/dateDsc) might take you there, but you may need to find the page on your own:
- Make sure you're on the first page of results
- Click "Download All" near the top of the page
- Wait for it to finish. It takes ~10 seconds per book, so it can take a while. It should show a pop-up when it's done.
- IMPORTANT: Chrome will probably show a pop up that says something like "Are you okay with this site downloading multiple files?" When it does, click "Allow," refresh the page, and restart the download process. It shouldn't pop up again.

## How do I stop it once it's started?

Refresh the page and it'll stop running.

## Something Break?

### I got an Amazon Dogs page

If you see one of the Amazon Error pages (with the dogs), something broke and you'll (sadly) have to start over. The script starts on whatever page of results you have selected and continues from there; if you successfully downloaded the first page before it failed, restart on the second, etc.

## Other Things

- This script does not download books from Kindle Unlimited or that are on loan from a library.
- If you want to watch the script work, open your browser console and search for LIB_DOWNLOADER
  - To open your browser console, right-click anywhere on the page, then click "Inspect," then go to the "Console" tab.
