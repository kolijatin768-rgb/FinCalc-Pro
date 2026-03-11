// GLOBAL CALCULATOR FUNCTIONS

function getDisplay() {
    return document.getElementById('display');
}

function getLivePrice() {
    return document.getElementById('live-price');
}

function appendNumber(num) {
    const display = getDisplay();
    if (display.value === '0' && num !== '.') {
        display.value = num;
    } else {
        display.value += num;
    }
}

function appendOperator(op) {
    const display = getDisplay();
    const lastChar = display.value.slice(-1);
    const operators = ['+', '-', '*', '/', '%'];
    
    if (operators.includes(lastChar)) {
        display.value = display.value.slice(0, -1) + op;
    } else {
        display.value += op;
    }
}

function clearDisplay() {
    getDisplay().value = '0';
    getLivePrice().innerText = '';
}

function deleteChar() {
    const display = getDisplay();
    display.value = display.value.slice(0, -1);
    if (display.value === '') display.value = '0';
}

function appendFunc(func) {
    const display = getDisplay();
    if (display.value === '0') display.value = '';
    display.value += func + '(';
}

function calculate() {
    try {
        let expression = getDisplay().value;

        // Replace custom visual operators with JS math operators
        expression = expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');

        // Scientific functions mapping
        expression = expression
            .replace(/sin\(/g, 'Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(')
            .replace(/log\(/g, 'Math.log10(');

        // Auto-close parentheses if user forgot
        const openParen = (expression.match(/\(/g) || []).length;
        const closeParen = (expression.match(/\)/g) || []).length;
        for (let i = 0; i < openParen - closeParen; i++) {
            expression += ')';
        }

        let result = eval(expression);
        
        // Handle precision and display
        if (!isFinite(result)) throw new Error("Infinity");
        getDisplay().value = Number(result.toFixed(8)).toString();

        // If in currency mode, update the conversion result immediately
        if (document.getElementById('asset-type').value === 'currency') {
            fetchAssetData();
        }
    } catch (e) {
        getDisplay().value = 'Error';
    }
}

// CURRENCY & API LOGIC

let currentRate = 0;
let oldRate = 0;

async function fetchAssetData() {
    const assetType = document.getElementById('asset-type').value;
    const from = document.getElementById('fromCurrency').value;
    const to = document.getElementById('toCurrency').value;
    const liveDisp = getLivePrice();
    
    if (assetType !== 'currency') {
        liveDisp.innerText = '';
        return;
    }

    liveDisp.innerText = 'Syncing...';

    try {
        const amount = parseFloat(getDisplay().value) || 0;
        const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
        
        if (!response.ok) throw new Error("API Error");
        
        const data = await response.json();
        
        oldRate = currentRate;
        currentRate = data.rates[to];

        const total = (amount * currentRate).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        // Set indicator color
        if (currentRate > oldRate && oldRate !== 0) {
            liveDisp.style.color = "#0efe01"; // Greenish accent
        } else if (currentRate < oldRate && oldRate !== 0) {
            liveDisp.style.color = "#ff2222"; // Reddish
        }

        const arrow = currentRate > oldRate ? "↑" : (currentRate < oldRate ? "↓" : "");
        liveDisp.innerHTML = `${amount} ${from} = <strong>${total} ${to}</strong> ${arrow}`;

    } catch (error) {
        liveDisp.innerText = 'Service Unavailable';
        console.error(error);
    }
}

// INITIALIZATION & UI EVENTS

document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById('theme-toggle');
    const assetType = document.getElementById('asset-type');
    const currencyRow = document.querySelector('.currency-row');
    const swapBtn = document.getElementById('swapBtn');

    // Default: Hide currency row if Standard Math is selected
    currencyRow.style.display = 'none';

    // Theme Switcher
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        themeToggle.innerHTML = newTheme === 'dark' ? 
            '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });

    // Asset Selection Toggle
    assetType.addEventListener('change', () => {
        if (assetType.value === 'currency') {
            currencyRow.style.display = 'flex';
            fetchAssetData();
        } else {
            currencyRow.style.display = 'none';
            getLivePrice().innerText = '';
        }
    });

    // Swap Currencies logic
    swapBtn.addEventListener('click', () => {
        const fromSelect = document.getElementById('fromCurrency');
        const toSelect = document.getElementById('toCurrency');
        const temp = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = temp;
        fetchAssetData();
    });

    // Update conversion when currency selection changes
    document.getElementById('fromCurrency').addEventListener('change', fetchAssetData);
    document.getElementById('toCurrency').addEventListener('change', fetchAssetData);

    // Visual Ripple Effect on Buttons
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function (e) {
            const ripple = document.createElement('span');
            const diameter = Math.max(this.clientWidth, this.clientHeight);
            const radius = diameter / 2;

            ripple.style.width = ripple.style.height = `${diameter}px`;
            ripple.style.left = `${e.clientX - this.getBoundingClientRect().left - radius}px`;
            ripple.style.top = `${e.clientY - this.getBoundingClientRect().top - radius}px`;
            ripple.classList.add('ripple');

            const existingRipple = this.querySelector('.ripple');
            if (existingRipple) existingRipple.remove();

            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Keyboard Support
    document.addEventListener('keydown', (e) => {
        if (e.key >= '0' && e.key <= '9') appendNumber(e.key);
        if (['+', '-', '*', '/'].includes(e.key)) appendOperator(e.key);
        if (e.key === '.') appendNumber('.');
        if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); calculate(); }
        if (e.key === 'Backspace') deleteChar();
        if (e.key === 'Escape') clearDisplay();
    });
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker Registered"));
}

let deferredPrompt;
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = "inline-block";
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();

  const result = await deferredPrompt.userChoice;

  if (result.outcome === "accepted") {
    console.log("App Installed");
  }

  deferredPrompt = null;
});

