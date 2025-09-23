document.addEventListener("DOMContentLoaded", () => {
  const checkbox = document.getElementById("enabled");
  const input = document.getElementById("sentence");

  if (!checkbox || !input) {
    console.error("No checkbox or input found");
    return;
  }

 
  chrome.storage.sync.get({ enabled: false }, (data) => {
    checkbox.checked = data.enabled;
    setBadgeText(data.enabled);
  });
  checkbox.addEventListener("change", (e) => {
    const on = !!e.target.checked;
    chrome.storage.sync.set({ enabled: on });
    setBadgeText(on);
  });


  chrome.storage.sync.get({ sentence: "" }, (data) => {
    input.value = data.sentence;
  });
  input.addEventListener("change", (e) => {
    chrome.storage.sync.set({ sentence: e.target.value || "" });
  });
});

function setBadgeText(enabled) {
  chrome.action.setBadgeText({ text: enabled ? "ON" : "OFF" });
}