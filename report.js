function goBack() {
  window.history.back();
}

function initReports() {
  switchReport();
  generateUsageReport();
  generateInventoryReport();
  generateInsights();
}

function switchReport() {
  const type = document.getElementById("reportType").value;
  document.getElementById("usageReport").style.display = type === "usage" ? "block" : "none";
  document.getElementById("inventoryReport").style.display = type === "inventory" ? "block" : "none";
  document.getElementById("insightReport").style.display = type === "insight" ? "block" : "none";
}

function searchReports() {
  const query = document.getElementById("reportSearch").value.toLowerCase();
  const type = document.getElementById("reportType").value;
  const tableId = type === "usage" ? "usageTable" : type === "inventory" ? "inventoryTable" : "insightTable";
  const table = document.getElementById(tableId);
  const rows = table.querySelectorAll("tbody tr");
  rows.forEach(row => {
    row.style.display = [...row.cells].some(cell => cell.innerText.toLowerCase().includes(query)) ? "" : "none";
  });
}

function generateUsageReport() {
  const tableBody = document.getElementById("usageTable").querySelector("tbody");
  tableBody.innerHTML = "";
  const usageLogs = JSON.parse(localStorage.getItem("usageLogs")) || [];
  usageLogs.forEach(log => {
    const row = `<tr>
      <td>${log.name}</td><td>${log.quantity}</td><td>${log.unit}</td>
      <td>${log.user || '-'}</td><td>${log.time}</td>
    </tr>`;
    tableBody.innerHTML += row;
  });
}

function generateInventoryReport() {
  const tableBody = document.getElementById("inventoryTable").querySelector("tbody");
  tableBody.innerHTML = "";
  const chemicals = JSON.parse(localStorage.getItem("chemicals")) || [];
  chemicals.forEach(chem => {
    const lowClass = chem.quantity < 50 ? "low-stock" : "";
    const row = `<tr class="${lowClass}">
      <td>${chem.name}</td><td>${chem.quantity}</td><td>${chem.unit}</td><td>${chem.time || '-'}</td>
    </tr>`;
    tableBody.innerHTML += row;
  });
}

function generateInsights() {
  const tableBody = document.getElementById("insightTable").querySelector("tbody");
  tableBody.innerHTML = "";
  const usageLogs = JSON.parse(localStorage.getItem("usageLogs")) || [];
  const summary = {};
  usageLogs.forEach(log => {
    if (!summary[log.name]) summary[log.name] = 0;
    summary[log.name] += parseFloat(log.quantity);
  });
  Object.keys(summary).forEach(name => {
    const row = `<tr><td>${name}</td><td>${summary[name]}</td></tr>`;
    tableBody.innerHTML += row;
  });
}

function exportToCSV(type) {
  let csv = "";
  const tableId = type === "usage" ? "usageTable" : type === "inventory" ? "inventoryTable" : "insightTable";
  const table = document.getElementById(tableId);
  const rows = table.querySelectorAll("tr");
  rows.forEach(row => {
    const cells = Array.from(row.querySelectorAll("th, td"));
    const rowData = cells.map(cell => cell.innerText).join(",");
    csv += rowData + "\n";
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${type}_report.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function clearLogs() {
  if (confirm("Are you sure you want to clear usage logs?")) {
    localStorage.removeItem("usageLogs");
    generateUsageReport();
    alert("Logs cleared.");
  }
}

function toggleColumns() {
  const cols = document.querySelectorAll("#usageTable th:nth-child(4), #usageTable th:nth-child(5), #usageTable td:nth-child(4), #usageTable td:nth-child(5)");
  cols.forEach(col => col.style.display = col.style.display === "none" ? "table-cell" : "none");
}

function renewStock() {
  alert("Renew Stock feature - to be implemented with admin check and update logic.");
}

function refreshInsights() {
  generateInsights();
}

function logout() {
  window.location.href = "./homepage.html";
}
