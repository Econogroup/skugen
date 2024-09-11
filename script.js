// Dark Mode Toggle
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

darkModeToggle.addEventListener('change', () => {
    body.classList.toggle('dark-mode');
});

// Radio button selection
function getSelectedRadioValue(name) {
    const radios = document.getElementsByName(name);
    for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            return radios[i].value;
        }
    }
    return null;
}

// SKU Generator
const form = document.getElementById('skuForm');
const result = document.getElementById('result');
const copyButton = document.getElementById('copyButton');
const exportButton = document.getElementById('exportButton');

let generatedSKUs = [];

form.addEventListener('submit', function(e) {
    e.preventDefault();
    const category = document.getElementById('category').value;
    const numericCode = document.getElementById('numericCode').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const selectedLetter = getSelectedRadioValue('shelf');

    if (!selectedLetter) {
        alert('Please select a shelf for the SKU code.');
        return;
    }

    generatedSKUs = [];
    for (let i = 0; i < quantity; i++) {
        let skuCode = generateSKU(category, numericCode, selectedLetter);
        generatedSKUs.push(skuCode);
    }

    result.innerHTML = generatedSKUs.join('<br>');
    copyButton.style.display = 'block';
    exportButton.style.display = 'block';
});

function generateSKU(category, numericCode, letter) {
    let numeric;
    if (numericCode.length === 12) { // UPC
        numeric = numericCode.slice(0, 2) + numericCode.slice(-3);
    } else if (numericCode.length === 5) { // 5-digit number
        numeric = numericCode;
    } else { // Generate random 5-digit number
        numeric = Math.floor(10000 + Math.random() * 90000).toString();
    }

    return `${category}-${numeric}${letter.toUpperCase()}`;
}

// Copy to Clipboard functionality
copyButton.addEventListener('click', () => {
    const textToCopy = result.innerText;
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('SKU codes copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
});

// Export functionality
exportButton.addEventListener('click', () => {
    const exportType = getSelectedRadioValue('export');
    if (!exportType) {
        alert('Please select an export type (Google Sheets or Spreadsheet).');
        return;
    }
    if (exportType === 'excel') {
        exportToExcel();
    } else if (exportType === 'google') {
        exportToGoogleSheets();
    }
});

function exportToExcel() {
    const worksheet = XLSX.utils.aoa_to_sheet([['SKU Code'], ...generatedSKUs.map(sku => [sku])]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SKU Codes');
    XLSX.writeFile(workbook, 'SKU_Codes.xlsx');
}

function exportToGoogleSheets() {
    gapi.load('client:auth2', initClient);
}

function initClient() {
    gapi.client.init({
        apiKey: 'YOUR_API_KEY',
        clientId: 'YOUR_CLIENT_ID',
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        scope: "https://www.googleapis.com/auth/spreadsheets"
    }).then(() => {
        gapi.auth2.getAuthInstance().signIn().then(() => {
            createSpreadsheet();
        });
    });
}

function createSpreadsheet() {
    gapi.client.sheets.spreadsheets.create({
        properties: {
            title: "SKU Codes"
        }
    }).then((response) => {
        const spreadsheetId = response.result.spreadsheetId;
        updateSpreadsheetValues(spreadsheetId);
    });
}

function updateSpreadsheetValues(spreadsheetId) {
    const values = [['SKU Code'], ...generatedSKUs.map(sku => [sku])];
    gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        resource: {
            values: values
        }
    }).then((response) => {
        alert('SKU codes exported to Google Sheets successfully!');
    }, (response) => {
        console.error('Error exporting to Google Sheets:', response.result.error.message);
    });
}
