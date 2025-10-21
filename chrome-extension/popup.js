const INTENT_TO_PAGE ={
  "post assessment brief":"post_assessment.html",
  "upload learning resources(content, activities, videos, etc)":"upload_resources.html",

}

function navigateToPage(intent) {
  if (!intent) return null;
  const key = intent.toLowerCase().replace(/[-_\s]+/g, " ").trim();
  const page = INTENT_TO_PAGE[key]; 
  if (!page) return null;
  return chrome.runtime.getURL(page);
}

document.addEventListener("DOMContentLoaded", async () => {
  const nameEl   = document.getElementById("userName");
  const checkbox = document.getElementById("enabled");
  const input    = document.getElementById("sentence");
  const statuEl = document.getElementById("status");
  const button = document.getElementById("search");
  const resultEl = document.getElementById("result");
  const clearBtn = document.getElementById("reset");

  if (!checkbox || !input) {
    console.error("No checkbox or input found");
    return;
  }

  // === Setting the slider bar ===
  let enabledState = false;

  function applyEnabledState(on){
    enabledState = !!on;

    input.disabled = !enabledState;
    button.disabled = !enabledState;
  }

  // === Display User Name ===
  try {
    const data = await chrome.storage.sync.get({ ak_login: { name: null } });
    if (data.ak_login?.name) {
        let name = data.ak_login.name.trim();

        name = name.replace(/\b[A-Z]{2,3}$/, "").trim();

        const parts = name.split(/\s+/);
        nameEl.textContent = parts[0];
    } else {
      nameEl.textContent = "Guest";
    }
  } catch (e) {
    console.error("Load username failed:", e);
    if (nameEl) nameEl.textContent = "Guest";
  }

  // === Enable/Disable Badge ===
  chrome.storage.sync.get({ enabled: false }, (data) => {
    checkbox.checked = data.enabled;
    setBadgeText(data.enabled);
    applyEnabledState(data.enabled);
  });
  checkbox.addEventListener("change", (e) => {
    const on = !!e.target.checked;
    chrome.storage.sync.set({ enabled: on });
    setBadgeText(on);
    applyEnabledState(on);
  });


  // === Input ===
  chrome.storage.sync.get({ sentence: "" }, (data) => {
    input.value = data.sentence;
  });

  input.addEventListener("input", (e) => {
    chrome.storage.sync.set({ sentence: e.target.value || "" });
  });

    // === reset status and result ===
    clearBtn.addEventListener("click", async () => {
        input.value = "";
        await chrome.storage.sync.set({ sentence: "" });
        statuEl.textContent = "";
        statuEl.hidden = true;
        resultEl.innerHTML = "";
    });

    

    // === Call model API ===
    button.addEventListener("click", async (ev) => {
        ev.preventDefault();
        const sentence = input.value.trim();
        if (!sentence){
            statuEl.textContent = "Please enter a sentence.";
            statuEl.hidden = false;
            return;
        }

        try {
            const response = await fetch("https://qilong122.pythonanywhere.com/predict",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({sentence})
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || `HTTP ${response.status}`);
            }

            const data = await response.json();

            const intentText = data.prediction || "No prediction";
            const PredictIntent = intentText.toLowerCase();

            // == handle othe intents ==
            if (PredictIntent === "others") {
              resultEl.innerHTML = `
              <div class="alert alert-warning small"> 
                 We cannot find the information you want from this website, please try again with other sentences!
              </div>`;
              statuEl.textContent = "Success";
            statuEl.hidden = true;
            return;
            }

            const targetUrl = navigateToPage(intentText);
            
            resultEl.innerHTML = `
              <div id="confirm-block" class="mb-2"> 
                <div id="confirm-title" class="mb-2">Do you want to <strong>${intentText}?</strong></div>
                <div class="d-flex gap-2">
                  <button id="confirm-yes" type="button" class="btn btn-success btn-sm">Yes</button>
                  <button id="confirm-no" type="button" class="btn btn-outline-secondary btn-sm">No</button>
                </div>
              </div>
            `;
            statuEl.textContent = "Success";
            statuEl.hidden = true;
            // === link to page if confirm is yes ===
            document.getElementById("confirm-yes")?.addEventListener("click", async () => {
              if (!targetUrl) {
                statuEl.textContent = 'Sorry, we cannot understand your intent this time; please rephrase your sentence and try again.';
                statuEl.hidden = false;
                return;
              }
                chrome.tabs.create({ url: targetUrl });
              });

            // === feedback if confirm is no ===
            document.getElementById("confirm-no")?.addEventListener("click", async () => {
              statuEl.textContent = '';
              statuEl.hidden = true;

              resultEl.insertAdjacentHTML("beforeend",
                `<div class="mt-2 small text-muted">
                Sorry, we couldn't understand your intent this time. Please rephrase your sentence and try again.
                <button id="retry" type="button" class="btn btn-link btn-sm p-0 ms-2">Clear & Retry</button>
                </div>`
              );

              resultEl.querySelector("#retry")?.addEventListener("click", async () => {
                input.value = "";
                chrome.storage.sync.set({ sentence: ""});
                resultEl.innerHTML = "";
                statuEl.textContent = "";
                statuEl.hidden = true;
                input.focus();      
              });
            });
            } catch (e) {
                console.error(e);
                statuEl.textContent = "Failed to call model";
                statuEl.hidden = false;
                resultEl.textContent = e.message || "Unknown error";
            }
            finally {
                button.disabled = false;
        }
    });
});

function setBadgeText(enabled) {
    chrome.action.setBadgeText({ text: enabled ? "ON" : "OFF" });
    }
