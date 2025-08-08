chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed and background initialized.");
});

chrome.action.onClicked.addListener((tab) => {
  console.log("Action clicked on", tab);
});
