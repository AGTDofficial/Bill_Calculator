// Application State
const state = {
    currentPage: 1,
    totalPages: 1,
    rowsPerPage: 15,
    pages: {}, // Store data for each page
    minRows: 5,
    maxRows: 30,
    darkMode: false
};

let pendingConfirmAction = null;

// Dark Mode Functions
function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    updateDarkMode();
    saveDarkModePreference();
}

function updateDarkMode() {
    const body = document.body;
    const darkModeBtn = document.getElementById('darkModeBtn');
    if (!darkModeBtn) {
        if (state.darkMode) body.classList.add('dark-mode');
        else body.classList.remove('dark-mode');
        return;
    }
    
    if (state.darkMode) {
        body.classList.add('dark-mode');
        darkModeBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
        `;
        darkModeBtn.title = "Toggle Light Mode";
    } else {
        body.classList.remove('dark-mode');
        darkModeBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
        `;
        darkModeBtn.title = "Toggle Dark Mode";
    }
}

function saveDarkModePreference() {
    localStorage.setItem('darkMode', state.darkMode);
}

function loadDarkModePreference() {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
        state.darkMode = savedDarkMode === 'true';
        updateDarkMode();
    }
}

// Initialize Application
function init() {
    loadDarkModePreference();
    initializePage(1);
    renderTable();
    updateUI();
    attachEventListeners();
}

// Initialize page data structure
function initializePage(pageNumber) {
    if (!state.pages[pageNumber]) {
        state.pages[pageNumber] = [];
        for (let i = 0; i < state.rowsPerPage; i++) {
            state.pages[pageNumber].push({
                serialNo: getSerialNumber(pageNumber, i),
                rate: '',
                quantity: '',
                total: 0
            });
        }
    }
}

// Get serial number for a row
function getSerialNumber(pageNumber, rowIndex) {
    let serialNo = rowIndex + 1;
    for (let i = 1; i < pageNumber; i++) {
        if (state.pages[i]) {
            serialNo += state.pages[i].length;
        }
    }
    return serialNo;
}

// Recalculate all serial numbers
function recalculateSerialNumbers() {
    let currentSerial = 1;
    for (let page = 1; page <= state.totalPages; page++) {
        if (state.pages[page]) {
            state.pages[page].forEach(row => {
                row.serialNo = currentSerial++;
            });
        }
    }
}

// Render Table
function renderTable() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const currentPageData = state.pages[state.currentPage];
    
    currentPageData.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.serialNo}</td>
            <td><input type="number" class="rate-input" data-index="${index}" value="${row.rate}" min="0" step="0.01" placeholder="0.00"></td>
            <td><input type="number" class="quantity-input" data-index="${index}" value="${row.quantity}" min="0" step="1" placeholder="0"></td>
            <td><input type="text" class="total-input" value="${formatCurrency(row.total)}" disabled></td>
        `;
        tbody.appendChild(tr);
    });
    
    // Attach input event listeners
    attachInputListeners();
}

// Attach input event listeners
function attachInputListeners() {
    const rateInputs = document.querySelectorAll('.rate-input');
    const quantityInputs = document.querySelectorAll('.quantity-input');
    
    rateInputs.forEach(input => {
        input.addEventListener('input', handleInputChange);
        input.addEventListener('focus', handleFocus);
        input.addEventListener('keydown', handleKeyDown);
    });
    
    quantityInputs.forEach(input => {
        input.addEventListener('input', handleInputChange);
        input.addEventListener('focus', handleFocus);
        input.addEventListener('keydown', handleKeyDown);
    });
}

// Handle input changes
function handleInputChange(e) {
    const index = parseInt(e.target.dataset.index);
    const currentPageData = state.pages[state.currentPage];
    
    if (e.target.classList.contains('rate-input')) {
        const value = parseFloat(e.target.value) || 0;
        if (value < 0) {
            e.target.value = 0;
            return;
        }
        currentPageData[index].rate = e.target.value;
    } else if (e.target.classList.contains('quantity-input')) {
        const value = parseFloat(e.target.value) || 0;
        if (value < 0) {
            e.target.value = 0;
            return;
        }
        currentPageData[index].quantity = e.target.value;
    }
    
    // Calculate total
    const rate = parseFloat(currentPageData[index].rate) || 0;
    const quantity = parseFloat(currentPageData[index].quantity) || 0;
    currentPageData[index].total = rate * quantity;
    
    // Update total field
    const row = e.target.closest('tr');
    const totalInput = row.querySelector('.total-input');
    totalInput.value = formatCurrency(currentPageData[index].total);
    
    // Update grand total
    updateGrandTotal();
    updatePageTotal();
    updateRowsUsed();
}

// Handle focus
function handleFocus(e) {
    const row = e.target.closest('tr');
    document.querySelectorAll('.bill-table tbody tr').forEach(tr => tr.classList.remove('active-row'));
    row.classList.add('active-row');
}

// Handle keyboard navigation
function handleKeyDown(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const currentInput = e.target;
        const index = parseInt(currentInput.dataset.index);
        const isRateInput = currentInput.classList.contains('rate-input');
        
        if (isRateInput) {
            // Move to quantity input in same row
            const quantityInput = document.querySelector(`.quantity-input[data-index="${index}"]`);
            quantityInput.focus();
        } else {
            // Move to rate input in next row
            const nextIndex = index + 1;
            if (nextIndex < state.rowsPerPage) {
                const nextRateInput = document.querySelector(`.rate-input[data-index="${nextIndex}"]`);
                nextRateInput.focus();
            }
        }
    }
}

// Calculate page total for current page
function calculatePageTotal() {
    let pageTotal = 0;
    const currentPageData = state.pages[state.currentPage];
    if (currentPageData) {
        currentPageData.forEach(row => {
            pageTotal += row.total;
        });
    }
    return pageTotal;
}

// Calculate grand total across all pages
function calculateGrandTotal() {
    let grandTotal = 0;
    Object.values(state.pages).forEach(pageData => {
        pageData.forEach(row => {
            grandTotal += row.total;
        });
    });
    return grandTotal;
}

// Update page total display
function updatePageTotal() {
    const pageTotal = calculatePageTotal();
    const el = document.getElementById('pageTotal');
    if (el) el.textContent = `Page ${state.currentPage}: ${formatCurrency(pageTotal)}`;
}

// Update grand total display
function updateGrandTotal() {
    const grandTotal = calculateGrandTotal();
    const el = document.getElementById('grandTotal');
    if (el) el.textContent = formatCurrency(grandTotal);
}

// Format currency
function formatCurrency(value) {
    return '₹' + value.toFixed(2);
}

// Update UI elements
function updateUI() {
    // Update page indicator
    const pageIndicator = document.getElementById('pageIndicator');
    if (pageIndicator) pageIndicator.textContent = `${state.currentPage} of ${state.totalPages}`;
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) pageInfo.textContent = `Page ${state.currentPage}`;
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) prevBtn.disabled = state.currentPage === 1;
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) nextBtn.disabled = false;
    
    // Update page total
    updatePageTotal();
    
    // Update grand total
    updateGrandTotal();
    
    // Update rows used
    updateRowsUsed();
}

// Update rows used counter
function updateRowsUsed() {
    const currentPageData = state.pages[state.currentPage];
    let usedRows = 0;
    currentPageData.forEach(row => {
        if (row.rate !== '' || row.quantity !== '') {
            usedRows++;
        }
    });
    const el = document.getElementById('rowsUsed');
    if (el) el.textContent = `${usedRows} of ${state.rowsPerPage}`;
}

// Navigate to previous page
function previousPage() {
    if (state.currentPage > 1) {
        state.currentPage--;
        renderTable();
        updateUI();
    }
}

// Navigate to next page
function nextPage() {
    state.currentPage++;
    if (state.currentPage > state.totalPages) {
        state.totalPages = state.currentPage;
        initializePage(state.currentPage);
    }
    renderTable();
    updateUI();
}

// Clear current page
function clearCurrentPage() {
    const currentPageData = state.pages[state.currentPage];
    currentPageData.forEach((row, index) => {
        row.rate = '';
        row.quantity = '';
        row.total = 0;
    });
    renderTable();
    updateUI();
}

// Clear all pages
function clearAllPages() {
    state.currentPage = 1;
    state.totalPages = 1;
    state.pages = {};
    initializePage(1);
    renderTable();
    updateUI();
}

// Download CSV
function downloadCSV() {
    let csv = 'Page,Serial No.,Rate,Quantity,Total\n';
    
    for (let page = 1; page <= state.totalPages; page++) {
        if (state.pages[page]) {
            state.pages[page].forEach(row => {
                if (row.rate !== '' || row.quantity !== '') {
                    csv += `${page},${row.serialNo},${row.rate},${row.quantity},${row.total}\n`;
                }
            });
        }
    }
    
    // Add grand total
    csv += `\n,,,Grand Total,${calculateGrandTotal()}`;
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bill_calculator_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Open Settings Modal
function openSettings() {
    const rowsPerPage = document.getElementById('rowsPerPage');
    if (rowsPerPage) rowsPerPage.value = state.rowsPerPage;
    const rowsValue = document.getElementById('rowsValue');
    if (rowsValue) rowsValue.textContent = state.rowsPerPage;
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.add('active');
}

// Close Settings Modal
function closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('active');
}

// Apply Settings
function applySettings() {
    const slider = document.getElementById('rowsPerPage');
    const newRowsPerPage = parseInt(slider ? slider.value : String(state.rowsPerPage));
    
    if (newRowsPerPage !== state.rowsPerPage) {
        state.rowsPerPage = newRowsPerPage;
        
        // Rebuild all pages with new row count
        const allData = [];
        for (let page = 1; page <= state.totalPages; page++) {
            if (state.pages[page]) {
                state.pages[page].forEach(row => {
                    if (row.rate !== '' || row.quantity !== '') {
                        allData.push({
                            rate: row.rate,
                            quantity: row.quantity,
                            total: row.total
                        });
                    }
                });
            }
        }
        
        // Rebuild pages
        state.pages = {};
        state.currentPage = 1;
        state.totalPages = 1;
        
        let currentPageNum = 1;
        let rowIndex = 0;
        
        initializePage(currentPageNum);
        
        allData.forEach(data => {
            if (rowIndex >= state.rowsPerPage) {
                currentPageNum++;
                state.totalPages = currentPageNum;
                initializePage(currentPageNum);
                rowIndex = 0;
            }
            
            state.pages[currentPageNum][rowIndex].rate = data.rate;
            state.pages[currentPageNum][rowIndex].quantity = data.quantity;
            state.pages[currentPageNum][rowIndex].total = data.total;
            rowIndex++;
        });
        
        recalculateSerialNumbers();
        renderTable();
        updateUI();
    }
    
    closeSettings();
}

// Show confirmation modal
function showConfirmation(title, message, onConfirm) {
    const t = document.getElementById('confirmTitle');
    if (t) t.textContent = title;
    const m = document.getElementById('confirmMessage');
    if (m) m.textContent = message;
    pendingConfirmAction = onConfirm;
    const modal = document.getElementById('confirmModal');
    if (modal) modal.classList.add('active');
}

// Close confirmation modal
function closeConfirmation() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.classList.remove('active');
    pendingConfirmAction = null;
}

// Execute confirmed action
function executeConfirmAction() {
    if (pendingConfirmAction) {
        pendingConfirmAction();
    }
    closeConfirmation();
}

// Open Help Modal
function openHelp() {
    const modal = document.getElementById('helpModal');
    if (modal) modal.classList.add('active');
}

// Close Help Modal
function closeHelp() {
    const modal = document.getElementById('helpModal');
    if (modal) modal.classList.remove('active');
}

// Calculator State
const calcState = {
    currentValue: '0',
    previousValue: null,
    operation: null,
    waitingForNewValue: false,
    // Note: keep calculator state single-sourced via fields above.
};

function isCalcModalOpen() {
    const m = document.getElementById('calcModal');
    return !!m && m.classList.contains('active');
}

function openCalculator() {
    const m = document.getElementById('calcModal');
    if (!m) return;
    m.classList.add('active');
    updateCalcDisplay();
}

function closeCalculator() {
    const m = document.getElementById('calcModal');
    if (!m) return;
    m.classList.remove('active');
}

function updateCalcDisplay() {
    const operationDisplay = document.getElementById('calcOperation');
    const currentDisplay = document.getElementById('calcCurrent');

    // Show operation with previous number (if that element exists)
    if (operationDisplay) {
        if (calcState.operation && calcState.previousValue !== null) {
            operationDisplay.textContent = `${calcState.previousValue} ${getOperationSymbol(calcState.operation)}`;
        } else {
            operationDisplay.textContent = '';
        }
    }

    // Show current number (if that element exists)
    if (currentDisplay) {
        currentDisplay.textContent = calcState.currentValue;
    }

    // Update legacy display wrapper for compatibility
    const legacyDisplay = document.getElementById('calcDisplay');
    if (legacyDisplay && !currentDisplay) {
        legacyDisplay.textContent = calcState.currentValue;
    }
}

function getOperationSymbol(op) {
    switch (op) {
        case '+': return '+';
        case '-': return '−';
        case '*': return '×';
        case '/': return '÷';
        case '%': return '%';
        default: return op;
    }
}

function normalizeCalcInputString(s) {
    if (!s) return '0';
    if (s === '-') return '0';
    if (s === '-0') return '0';
    if (s === '-0.') return '-0.';
    if (s === '0.') return '0.';
    return s;
}

function countDigits(s) {
    return (s || '').replace('-', '').replace('.', '').length;
}

function formatForCalcDisplay(value) {
    if (value === null || value === undefined) return '0';
    if (!Number.isFinite(value)) return 'Error';
    if (Object.is(value, -0)) value = 0;

    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    if (abs === 0) return '0';

    const intDigits = Math.floor(Math.log10(abs)) + 1;
    if (intDigits > 12) {
        // Use scientific notation to stay within 12 digits
        return value.toExponential(6).replace('+', '');
    }

    const s = abs.toPrecision(12);
    let trimmed = s;
    if (trimmed.includes('.')) {
        trimmed = trimmed.replace(/\.?0+$/, '');
    }
    return sign + trimmed;
}

function calcCurrentValue() {
    const n = Number(calcState.currentValue);
    return Number.isFinite(n) ? n : NaN;
}

function calcClearAll() {
    calcState.currentValue = '0';
    calcState.previousValue = null;
    calcState.operation = null;
    calcState.waitingForNewValue = false;
    updateCalcDisplay();
}

function calcBackspace() {
    if (calcState.waitingForNewValue) return;
    let s = calcState.currentValue;
    if (s.length <= 1 || (s.length === 2 && s.startsWith('-'))) {
        calcState.currentValue = '0';
        calcState.waitingForNewValue = true;
        updateCalcDisplay();
        return;
    }
    s = s.slice(0, -1);
    calcState.currentValue = normalizeCalcInputString(s);
    updateCalcDisplay();
}

function calcInputDigit(digit) {
    if (calcState.currentValue === 'Error') {
        calcClearAll();
    }

    if (calcState.waitingForNewValue) {
        calcState.currentValue = digit;
        calcState.waitingForNewValue = false;
        updateCalcDisplay();
        return;
    }

    // Enforce max 12 digits (excluding sign and decimal point)
    if (countDigits(calcState.currentValue) >= 12) return;

    if (calcState.currentValue === '0') {
        calcState.currentValue = digit;
    } else {
        calcState.currentValue += digit;
    }
    updateCalcDisplay();
}

function calcInputDecimal() {
    if (calcState.currentValue === 'Error') {
        calcClearAll();
    }

    if (calcState.waitingForNewValue) {
        calcState.currentValue = '0.';
        calcState.waitingForNewValue = false;
        updateCalcDisplay();
        return;
    }

    if (!calcState.currentValue.includes('.')) {
        calcState.currentValue += '.';
        updateCalcDisplay();
    }
}

function calcToggleSign() {
    if (calcState.currentValue === 'Error') {
        calcClearAll();
        return;
    }

    if (calcState.waitingForNewValue) {
        calcState.currentValue = '0';
        calcState.waitingForNewValue = false;
    }

    if (calcState.currentValue.startsWith('-')) {
        calcState.currentValue = calcState.currentValue.slice(1);
    } else if (calcState.currentValue !== '0') {
        calcState.currentValue = '-' + calcState.currentValue;
    }
    calcState.currentValue = normalizeCalcInputString(calcState.currentValue);
    updateCalcDisplay();
}

function calcPercent() {
    if (calcState.currentValue === 'Error') {
        calcClearAll();
        return;
    }
    const current = calcCurrentValue();
    if (!Number.isFinite(current)) return;
    const next = current / 100;
    calcState.currentValue = formatForCalcDisplay(next);
    calcState.waitingForNewValue = true;
    updateCalcDisplay();
}

function calcCompute(a, op, b) {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return b === 0 ? NaN : a / b;
        default: return b;
    }
}

function calcSetOperator(op) {
    if (calcState.currentValue === 'Error') {
        calcClearAll();
    }

    const current = parseFloat(calcState.currentValue);
    if (!Number.isFinite(current)) {
        calcState.currentValue = 'Error';
        calcState.waitingForNewValue = true;
        updateCalcDisplay();
        return;
    }

    if (calcState.operation && calcState.previousValue !== null && !calcState.waitingForNewValue) {
        const result = calcCompute(calcState.previousValue, calcState.operation, current);
        if (!Number.isFinite(result)) {
            calcState.currentValue = 'Error';
            calcState.previousValue = null;
            calcState.operation = null;
            calcState.waitingForNewValue = true;
            updateCalcDisplay();
            return;
        }
        calcState.previousValue = result;
        calcState.currentValue = formatForCalcDisplay(result);
    } else if (calcState.previousValue === null) {
        calcState.previousValue = current;
    }

    calcState.operation = op;
    calcState.waitingForNewValue = true;
    updateCalcDisplay();
}

function calcEquals() {
    if (!calcState.operation || calcState.previousValue === null) return;
    const current = calcCurrentValue();
    const result = calcCompute(calcState.previousValue, calcState.operation, current);

    if (!Number.isFinite(result)) {
        calcState.currentValue = 'Error';
        calcState.previousValue = null;
        calcState.operation = null;
        calcState.waitingForNewValue = true;
        updateCalcDisplay();
        return;
    }

    calcState.currentValue = formatForCalcDisplay(result);
    calcState.previousValue = null;
    calcState.operation = null;
    calcState.waitingForNewValue = true;
    updateCalcDisplay();
}

function handleCalculatorKeyPress(e) {
    if (!isCalcModalOpen()) return;

    const key = e.key;

    // Prevent page interactions while calculator is open
    if (key.length === 1 || key === 'Enter' || key === 'Backspace') {
        e.preventDefault();
    }

    if (key >= '0' && key <= '9') return calcInputDigit(key);
    if (key === '.') return calcInputDecimal();
    if (key === '+' || key === '-' || key === '*' || key === '/') return calcSetOperator(key);
    if (key === '=' || key === 'Enter') return calcEquals();
    if (key === 'Backspace') return calcBackspace();
    if (key === 'Escape') return closeCalculator();
    if (key.toLowerCase() === 'c') return calcClearAll();
    if (key === '%') return calcPercent();
}

function handleCalcKeyAction(action, el) {
    if (!action || !el) return;
    if (action === 'digit') return calcInputDigit(el.dataset.digit ?? '0');
    if (action === 'decimal') return calcInputDecimal();
    if (action === 'operator') return calcSetOperator(el.dataset.op);
    if (action === 'equals') return calcEquals();
    if (action === 'clear') return calcClearAll();
    if (action === 'backspace') return calcBackspace();
    if (action === 'percent') return calcPercent();
    if (action === 'sign') return calcToggleSign();
}

function wireCalculatorControls() {
    const calcModal = document.getElementById('calcModal');
    if (!calcModal) return;

    const modalContent = calcModal.querySelector('.modal-content');
    if (modalContent) {
        // Prevent outside-click handler from ever seeing clicks inside
        modalContent.addEventListener('pointerdown', (e) => e.stopPropagation());
        modalContent.addEventListener('click', (e) => e.stopPropagation());
    }

    const keypad = calcModal.querySelector('.calculator-keys');
    if (keypad) {
        const handle = (e) => {
            const key = e.target.closest('.calc-key');
            if (!key) return;
            e.preventDefault();
            e.stopPropagation();
            handleCalcKeyAction(key.dataset.action, key);
        };

        // pointerdown works for mouse + touch reliably.
        // Don't also bind 'click' or mouse clicks will trigger twice.
        keypad.addEventListener('pointerdown', handle);
    }
}

// Attach Event Listeners
function attachEventListeners() {
    const on = (id, event, handler) => {
        const el = document.getElementById(id);
        if (!el) return null;
        el.addEventListener(event, handler);
        return el;
    };

    // Dark mode toggle
    on('darkModeBtn', 'click', toggleDarkMode);
    
    // Navigation
    on('prevBtn', 'click', previousPage);
    on('nextBtn', 'click', nextPage);
    
    // Actions
    on('clearPageBtn', 'click', () => {
        showConfirmation(
            'Clear Current Page',
            'Are you sure you want to clear all data on this page?',
            clearCurrentPage
        );
    });
    
    on('clearAllBtn', 'click', () => {
        showConfirmation(
            'Clear All Pages',
            'Are you sure you want to clear all data from all pages? This action cannot be undone.',
            clearAllPages
        );
    });
    
    on('downloadBtn', 'click', downloadCSV);
    
    // Settings
    on('settingsBtn', 'click', openSettings);
    on('closeSettingsBtn', 'click', closeSettings);
    on('cancelSettingsBtn', 'click', closeSettings);
    on('applySettingsBtn', 'click', applySettings);
    
    // Settings slider
    on('rowsPerPage', 'input', (e) => {
        const v = document.getElementById('rowsValue');
        if (v) v.textContent = e.target.value;
    });
    
    // Confirmation modal
    on('cancelConfirmBtn', 'click', closeConfirmation);
    on('confirmActionBtn', 'click', executeConfirmAction);
    
    // Help
    on('helpBtn', 'click', openHelp);
    on('closeHelpBtn', 'click', closeHelp);
    on('closeHelpOkBtn', 'click', closeHelp);

    // Calculator
    on('calcBtn', 'click', openCalculator);
    on('closeCalcBtn', 'click', closeCalculator);
    wireCalculatorControls();

    window.addEventListener('keydown', handleCalculatorKeyPress);
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            if (e.target.id === 'settingsModal') closeSettings();
            if (e.target.id === 'confirmModal') closeConfirmation();
            if (e.target.id === 'helpModal') closeHelp();
            if (e.target.id === 'calcModal') closeCalculator();
        }
    });
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}