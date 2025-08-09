console.log("✅ TradingView Auto Monitor started  ");

const strategyTesterButtonSelector =
  "#footer-chart-panel > div.tabbar-n3UmcVi3 > div:nth-child(1) > div:nth-child(2) > button";
const listOfTradesButtonSelector = "#List\\ of\\ Trades";
const positionPercentageSelector =
  "#bottom-area > div.bottom-widgetbar-content.backtesting > div > div > div > div.wrapper-UQYV_qXv > div > div > table > tbody > tr:nth-child(3) > td:nth-child(8) > div > div:nth-child(2)";

const positionOpenPriceSelector =
  "#bottom-area > div.bottom-widgetbar-content.backtesting > div > div > div > div.wrapper-UQYV_qXv > div > div > table > tbody > tr:nth-child(3) > td:nth-child(6) > div > div:nth-child(2) > div > div > div";

const positionClosePriceSelector =
  "#bottom-area > div.bottom-widgetbar-content.backtesting > div > div > div > div.wrapper-UQYV_qXv > div > div > table > tbody > tr:nth-child(3) > td:nth-child(6) > div > div:nth-child(1) > div > div > div";

const positionDirectionSelector =
  "#bottom-area > div.bottom-widgetbar-content.backtesting > div > div > div > div.wrapper-UQYV_qXv > div > div > table > tbody > tr:nth-child(3) > td:nth-child(5) > div > div:nth-child(2) > div";

function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const intervalTime = 100;
    let elapsed = 0;

    const interval = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(interval);
        resolve(element);
      } else {
        const strategyTesterButton = document.querySelector(
          strategyTesterButtonSelector
        );

        if (strategyTesterButton && !isStrategyTesterButtonClicked) {
          strategyTesterButton.click();
          isStrategyTesterButtonClicked = true;
          console.log("🖱️ Clicked the button.");
        } else if (strategyTesterButton && isStrategyTesterButtonClicked) {
          const listOfTradesButton = document.querySelector(
            listOfTradesButtonSelector
          );
          if (listOfTradesButton && !isListOfTradesButtonClicked) {
            listOfTradesButton.click();
            isListOfTradesButtonClicked = true;
            console.log("🖱️ List of Trades Button clicked.");
          }
          console.log("🖱️ StrategyTester Button already clicked.");
        } else {
          console.warn("⚠️ Button not found.");
        }
      }

      elapsed += intervalTime;
      if (elapsed >= timeout) {
        clearInterval(interval);
        reject("Element not found in time.");
      }
    }, intervalTime);
  });
}

// Selector for the target element to track changes
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

function saveToStorage(key, value) {
  chrome.storage.local.set({ [key]: value }, () => {
    console.log("✅ Saved to storage:", key, value);
  });
}

function loadFromStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key]);
    });
  });
}

async function trackChange() {
  isStrategyTesterButtonClicked = false;
  isListOfTradesButtonClicked = false;
  try {
    const tradeResultPerPercentage = await waitForElement(
      positionPercentageSelector
    )
      .then((el) => {
        console.log("✅ Found data element:", el.innerHTML);

        // Wait again for updated target element (optional)
        return waitForElement(positionPercentageSelector);
      })
      .catch((err) => {
        console.warn("❌", err);
      });

    const currentValue = tradeResultPerPercentage.innerText.trim(); // Or use innerHTML if needed

    const storageKey = "lastTrackedValue";

    if (!previousValue) {
      console.log("🆕 First time tracking. Saving current value only.");
      saveToStorage(storageKey, currentValue);
      previousValue = await loadFromStorage(storageKey);
    } else if (currentValue !== previousValue) {
      console.log("🔁 Value changed!");
      const positionPercentage = document.querySelector(
        positionPercentageSelector
      ).innerHTML;

      const positionOpenPrice = document.querySelector(
        positionOpenPriceSelector
      ).innerHTML;

      const positionClosePrice = document.querySelector(
        positionClosePriceSelector
      ).innerHTML;

      const positionDirection = document.querySelector(
        positionDirectionSelector
      ).innerHTML;

      console.log("Old:", previousValue, "→ New:", currentValue);

      // Save the new value (overwrite the old one)
      saveToStorage(storageKey, currentValue);

      // Step 2: Get the current time
      const now = new Date();
      dataFrame = {
        positionPercentage,
        positionOpenPrice,
        positionClosePrice,
        positionDirection,
        timeISO: now.toISOString(),
        timeUnix: now.getTime(),
      };
      chrome.storage.local.get(["tradeResult"], (result) => {
        const currentData = result.myData || [];
        currentData.push(dataFrame); // newData = your object

        chrome.storage.local.set({ myData: currentData }, () => {
          console.log(
            `✅ Data updated in Chrome storage. positionPercentage:${positionPercentage} | positionOpenPrice:${positionOpenPrice} | positionClosePrice:${positionClosePrice} | positionDirection:${positionDirection} `
          );
        });
      });

      console.log("✅ Data appended without overwriting previous content.");
    } else {
      console.log("✅ Value is the same. Nothing changed.");
    }
  } catch (err) {
    console.warn("❌ Error:", err);
  }
}

// Run on load
let previousValue = false;
setInterval(() => {
  trackChange();
}, 10000); // 45,000 ms = 45 seconds

// You can add more logic here like scraping data or interacting with the page
