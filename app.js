const XRPN_PRICE = 0.0028;
const ETH_PRICE = 3150;
let activeToken = "ETH";
let walletConnected = false;

function formatMoney(value, digits = 2) {
  return "$" + Number(value).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
}

async function updateXRPPrice() {
  const priceEl = document.getElementById("xrp-price");
  const multEl = document.getElementById("xrp-mult");
  const profitEl = document.getElementById("profit-box");
  if (!priceEl || !multEl) return;

  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd");
    const data = await res.json();
    const price = data?.ripple?.usd;

    if (!price) throw new Error("No price");

    priceEl.textContent = formatMoney(price, 2);

    const mult = price / XRPN_PRICE;
    multEl.textContent = "If XRPN reaches XRP’s current price: up to " + Math.round(mult) + "x";

    if (profitEl) {
      const projected = 100 * mult;
      profitEl.innerHTML =
        "$100 today could represent <strong>" +
        formatMoney(projected, 0) +
        "</strong> if XRPN reaches XRP’s current price.";
    }

    const liveXrpBar = document.getElementById("live-xrp-bar");
    const liveXrpFill = document.getElementById("live-xrp-fill");
    if (liveXrpBar) liveXrpBar.textContent = formatMoney(price, 2);
    if (liveXrpFill) {
      const pct = Math.min(100, Math.max(8, (price / 2.5) * 100));
      liveXrpFill.style.width = pct + "%";
    }
  } catch (e) {
    priceEl.textContent = "Unavailable";
    multEl.textContent = "Live XRP price temporarily unavailable.";
    if (profitEl) {
      profitEl.textContent = "Projection will appear once the live XRP price loads again.";
    }
  }
}

function setPaymentTab(token) {
  activeToken = token;
  const ethBtn = document.getElementById("tab-eth");
  const usdtBtn = document.getElementById("tab-usdt");
  const label = document.getElementById("pay-label");
  const tag = document.getElementById("pay-tag");
  const input = document.getElementById("pay-input");

  if (!ethBtn || !usdtBtn || !label || !tag || !input) return;

  ethBtn.classList.toggle("active", token === "ETH");
  usdtBtn.classList.toggle("active", token === "USDT");
  label.textContent = token === "ETH" ? "Amount you pay in ETH" : "Amount you pay in USDT";
  tag.textContent = token;
  input.value = "";
  updateReceive();
}

function updateReceive() {
  const input = document.getElementById("pay-input");
  const receive = document.getElementById("receive-value");
  if (!input || !receive) return;

  const value = parseFloat(input.value) || 0;
  const usd = activeToken === "ETH" ? value * ETH_PRICE : value;
  const amount = usd / XRPN_PRICE;

  receive.textContent = value > 0 ? Math.floor(amount).toLocaleString() : "—";
}

function startCountdown() {
  let seconds = 1 * 86400 + 23 * 3600 + 41 * 60 + 7;
  const d = document.getElementById("cd-d");
  const h = document.getElementById("cd-h");
  const m = document.getElementById("cd-m");
  const s = document.getElementById("cd-s");
  if (!d || !h || !m || !s) return;

  const render = () => {
    const pad = n => String(n).padStart(2, "0");
    d.textContent = pad(Math.floor(seconds / 86400));
    h.textContent = pad(Math.floor((seconds % 86400) / 3600));
    m.textContent = pad(Math.floor((seconds % 3600) / 60));
    s.textContent = pad(seconds % 60);
  };

  render();
  setInterval(() => {
    if (seconds > 0) seconds--;
    render();
  }, 1000);
}

async function connectWallet() {
  if (!window.ethereum) {
    showToast("MetaMask is required to connect a wallet.");
    return;
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const addr = accounts[0];
    const short = addr.slice(0, 6) + "..." + addr.slice(-4);

    const walletBox = document.getElementById("wallet-box");
    const walletAddr = document.getElementById("wallet-addr");
    const connectBtn = document.getElementById("connect-btn");
    const buyBtn = document.getElementById("buy-btn");

    if (walletBox) walletBox.classList.add("show");
    if (walletAddr) walletAddr.textContent = addr;
    if (connectBtn) connectBtn.textContent = short;
    if (buyBtn) buyBtn.textContent = "Buy XRPN";
    walletConnected = true;

    showToast("Wallet connected: " + short);
  } catch (e) {
    showToast("Wallet connection was cancelled.");
  }
}

function handleBuy() {
  const input = document.getElementById("pay-input");
  const value = parseFloat(input?.value) || 0;

  if (!walletConnected) {
    connectWallet();
    return;
  }

  if (!value) {
    showToast("Please enter an amount first.");
    return;
  }

  if (activeToken === "ETH") {
    showToast("Demo flow: ETH purchase request prepared.");
  } else {
    showToast("Demo flow: USDT approve + buy request prepared.");
  }
}

function initFaq() {
  document.querySelectorAll(".faq-q").forEach(btn => {
    btn.addEventListener("click", () => {
      const answer = btn.nextElementSibling;
      const icon = btn.querySelector(".faq-icon");
      const open = answer.classList.contains("open");

      document.querySelectorAll(".faq-a").forEach(a => a.classList.remove("open"));
      document.querySelectorAll(".faq-icon").forEach(i => {
        i.textContent = "+";
      });

      if (!open) {
        answer.classList.add("open");
        if (icon) icon.textContent = "–";
      }
    });
  });
}

/* 검색 불가능한 가짜 지갑 아이디 생성 */
function randomPseudoPart(length) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function makePseudoWalletId() {
  return "0x" + randomPseudoPart(2) + "..." + randomPseudoPart(1) + randomPseudoPart(3);
}

/* 가짜 구매 알림 */
function startSocialProof() {
  setInterval(() => {
    const wallet = makePseudoWalletId();
    const amount = (Math.random() * 2.8 + 0.2).toFixed(2);
    showToast(wallet + " bought " + amount + " ETH");
  }, 9000);
}

document.addEventListener("DOMContentLoaded", () => {
  updateXRPPrice();
  setInterval(updateXRPPrice, 15000);
  startCountdown();
  initFaq();
  startSocialProof();

  const input = document.getElementById("pay-input");
  if (input) input.addEventListener("input", updateReceive);
});
