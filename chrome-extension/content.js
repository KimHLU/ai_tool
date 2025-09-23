function getUserNameFromDom() {

      const userText = document.querySelector(".usermenu .usertext");
        if (userText?.textContent?.trim()) return userText.textContent.trim();

        const toggle = document.querySelector("#user-menu-toggle, .usermenu .dropdown-toggle");
        if (toggle?.textContent?.trim()) return toggle.textContent.trim();

    const bodyText = document.body?.innerText || "";
    const m = bodyText.match(/Kia\s+ora,\s*([A-Za-z\-'\s]+),\s*welcome\s+back/i);
    if (m && m[1]) return m[1].trim();

    return null;
    
}

function detectLogin() {
  const hasLoginLink = document.querySelector('a[href*="login/index.php"]');
  const hasUserMenu  = document.querySelector(".usermenu") || document.querySelector('a[href*="logout"]');
  return !hasLoginLink && !!hasUserMenu;
}

(function main() {
  const loggedIn = detectLogin();
  const name = loggedIn ? getUserNameFromDom() : null;

  chrome.storage.sync.set({
    ak_login: { loggedIn, name, ts: Date.now(), url: location.href }
  });

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "GET_LOGIN_STATUS") {
      sendResponse({ loggedIn, name });
    }
  });
})();