// Application State
const state = {
    currentPage: 1,
    totalPages: 1,
    rowsPerPage: 15,
    pages: {}, // Store data for each page
    minRows: 5,
    maxRows: 30
};

let pendingConfirmAction = null;

// Initialize Application
function init() {
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

// Update grand total display
function updateGrandTotal() {
    const grandTotal = calculateGrandTotal();
    document.getElementById('grandTotal').textContent = formatCurrency(grandTotal);
}

// Format currency
function formatCurrency(value) {
    return '₹' + value.toFixed(2);
}

// Update UI elements
function updateUI() {
    // Update page indicator
    document.getElementById('pageIndicator').textContent = `${state.currentPage} of ${state.totalPages}`;
    document.getElementById('pageInfo').textContent = `Page ${state.currentPage}`;
    
    // Update navigation buttons
    document.getElementById('prevBtn').disabled = state.currentPage === 1;
    document.getElementById('nextBtn').disabled = false;
    
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
    document.getElementById('rowsUsed').textContent = `${usedRows} of ${state.rowsPerPage}`;
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
    document.getElementById('rowsPerPage').value = state.rowsPerPage;
    document.getElementById('rowsValue').textContent = state.rowsPerPage;
    document.getElementById('settingsModal').classList.add('active');
}

// Close Settings Modal
function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
}

// Apply Settings
function applySettings() {
    const newRowsPerPage = parseInt(document.getElementById('rowsPerPage').value);
    
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
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    pendingConfirmAction = onConfirm;
    document.getElementById('confirmModal').classList.add('active');
}

// Close confirmation modal
function closeConfirmation() {
    document.getElementById('confirmModal').classList.remove('active');
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
    document.getElementById('helpModal').classList.add('active');
}

// Close Help Modal
function closeHelp() {
    document.getElementById('helpModal').classList.remove('active');
}

// Attach Event Listeners
function attachEventListeners() {
    // Navigation
    document.getElementById('prevBtn').addEventListener('click', previousPage);
    document.getElementById('nextBtn').addEventListener('click', nextPage);
    
    // Actions
    document.getElementById('clearPageBtn').addEventListener('click', () => {
        showConfirmation(
            'Clear Current Page',
            'Are you sure you want to clear all data on this page?',
            clearCurrentPage
        );
    });
    
    document.getElementById('clearAllBtn').addEventListener('click', () => {
        showConfirmation(
            'Clear All Pages',
            'Are you sure you want to clear all data from all pages? This action cannot be undone.',
            clearAllPages
        );
    });
    
    document.getElementById('downloadBtn').addEventListener('click', downloadCSV);
    
    // Settings
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('closeSettingsBtn').addEventListener('click', closeSettings);
    document.getElementById('cancelSettingsBtn').addEventListener('click', closeSettings);
    document.getElementById('applySettingsBtn').addEventListener('click', applySettings);
    
    // Settings slider
    document.getElementById('rowsPerPage').addEventListener('input', (e) => {
        document.getElementById('rowsValue').textContent = e.target.value;
    });
    
    // Confirmation modal
    document.getElementById('cancelConfirmBtn').addEventListener('click', closeConfirmation);
    document.getElementById('confirmActionBtn').addEventListener('click', executeConfirmAction);
    
    // Help
    document.getElementById('helpBtn').addEventListener('click', openHelp);
    document.getElementById('closeHelpBtn').addEventListener('click', closeHelp);
    document.getElementById('closeHelpOkBtn').addEventListener('click', closeHelp);
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            if (e.target.id === 'settingsModal') closeSettings();
            if (e.target.id === 'confirmModal') closeConfirmation();
            if (e.target.id === 'helpModal') closeHelp();
        }
    });
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}