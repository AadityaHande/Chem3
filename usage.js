// usage.js (Final Merged Version)

// --- Firebase Integration ---
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Load Firebase user data and role
onAuthStateChanged(auth, async (user) => {
  if (user) {
    document.getElementById("userName").textContent = user.displayName || "User";
    document.getElementById("userEmail").textContent = user.email;

    if (user.photoURL && document.getElementById("userAvatar")) {
      document.getElementById("userAvatar").src = user.photoURL;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const role = userData.role || "-";
        document.getElementById("userRole").textContent = role;

        // Role-based button visibility
        if (role === "admin" || role === "teacher") {
          window.allowedToEdit = true;
          const reportsBtn = document.getElementById("reportsBtn");
          if (reportsBtn) reportsBtn.style.display = "inline-block";
          const addBtn = document.getElementById("addChemicalBtn");
          if (addBtn) addBtn.style.display = "block";
        } else {
          window.allowedToEdit = false;
        }
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  } else {
    window.location.href = "./login-a.html";
  }
});

// Logout handling
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    signOut(auth)
      .then(() => window.location.href = "./login-a.html")
      .catch((error) => console.error("Logout error:", error));
  });
}

// Chemical Data Handling
let chemicals = JSON.parse(localStorage.getItem("chemicals")) || [];

function convertToBaseUnit(quantity, unit) {
  const unitConversion = {
    ml: 1,
    litre: 1000,
    g: 1,
    kg: 1000,
  };
  return quantity * (unitConversion[unit] || 1);
}

function logUsageAction(name, quantity, unit, actionType, user = "Unknown") {
  const logs = JSON.parse(localStorage.getItem("usageLogs")) || [];
  logs.push({
    name,
    quantity,
    unit,
    user,
    time: new Date().toISOString(),
    action: actionType,
  });
  localStorage.setItem("usageLogs", JSON.stringify(logs));
}

export function searchChemicals() {
  const query = document.getElementById("searchBar").value.toLowerCase();
  const filtered = chemicals.filter((c) =>
    c.name.toLowerCase().includes(query)
  );
  displayChemicals(filtered);
}

export function sortChemicals() {
  const sortBy = document.getElementById("sort").value;
  chemicals.sort((a, b) => {
    const aQty = convertToBaseUnit(a.quantity, a.unit);
    const bQty = convertToBaseUnit(b.quantity, b.unit);
    if (sortBy === "low-quantity") return aQty - bQty;
    if (sortBy === "high-quantity") return bQty - aQty;
    if (sortBy === "latest-time") return new Date(b.time) - new Date(a.time);
  });
  saveToLocalStorage();
  displayChemicals(chemicals);
}

export function displayChemicals(list) {
  const listContainer = document.getElementById("chemicalList");
  listContainer.innerHTML = "";
  list.forEach((chem) => {
    listContainer.innerHTML += `
      <li class="chemical-item">
        <span>${chem.name} - ${chem.quantity} ${chem.unit} (Updated: ${new Date(chem.time).toLocaleString()})</span>
        <div>
          <button class="edit-btn" onclick="editChemical('${chem.name}')">Edit</button>
          <button class="add-btn" onclick="addQuantity('${chem.name}')">Add</button>
          <button class="delete-btn" onclick="deleteChemical('${chem.name}')">Delete</button>
        </div>
      </li>
    `;
  });
}

export function addChemical() {
  if (!window.allowedToEdit) return alert("Permission denied.");
  let name = prompt("Enter chemical name:");
  let quantity = parseFloat(prompt("Enter quantity:"));
  let unit = prompt("Enter unit (ml, litre, g, kg):").toLowerCase();
  if (!name || isNaN(quantity) || !unit) return alert("Invalid input!");

  if (chemicals.some((c) => c.name.toLowerCase() === name.toLowerCase()))
    return alert("Chemical already exists!");

  let time = new Date().toISOString();
  chemicals.push({ name, quantity, unit, time });
  logUsageAction(name, quantity, unit, "Added", document.getElementById("userEmail")?.innerText || "Unknown");
  saveToLocalStorage();
  displayChemicals(chemicals);
}

export function editChemical(name) {
  if (!window.allowedToEdit) return alert("Permission denied.");
  let chem = chemicals.find((c) => c.name === name);
  if (!chem) return alert("Chemical not found.");
  let newQuantity = parseFloat(prompt(`Enter new quantity for ${name}:`));
  let newUnit = prompt(`Enter new unit for ${name}:`).toLowerCase();
  if (isNaN(newQuantity) || !newUnit) return alert("Invalid input!");

  chem.quantity = newQuantity;
  chem.unit = newUnit;
  chem.time = new Date().toISOString();
  logUsageAction(name, newQuantity, newUnit, "Edited", document.getElementById("userEmail")?.innerText || "Unknown");
  saveToLocalStorage();
  displayChemicals(chemicals);
}

export function addQuantity(name) {
  if (!window.allowedToEdit) return alert("Permission denied.");
  let chem = chemicals.find((c) => c.name === name);
  if (!chem) return alert("Chemical not found.");
  let qty = parseFloat(prompt(`Enter quantity to add for ${name}:`));
  if (isNaN(qty) || qty <= 0) return alert("Invalid quantity.");
  let unit = prompt("Enter unit (ml, litre, g, kg):").toLowerCase();
  if (!["ml", "litre", "g", "kg"].includes(unit)) return alert("Invalid unit.");

  let total = convertToBaseUnit(chem.quantity, chem.unit) + convertToBaseUnit(qty, unit);
  chem.quantity = total / convertToBaseUnit(1, unit);
  chem.unit = unit;
  chem.time = new Date().toISOString();
  logUsageAction(name, qty, unit, "Added Quantity", document.getElementById("userEmail")?.innerText || "Unknown");
  saveToLocalStorage();
  displayChemicals(chemicals);
}

export function deleteChemical(name) {
  if (!window.allowedToEdit) return alert("Permission denied.");
  let chem = chemicals.find((c) => c.name === name);
  if (!chem) return alert("Chemical not found.");
  if (!confirm(`Are you sure you want to delete ${name}?`)) return;
  chemicals = chemicals.filter((c) => c.name !== name);
  logUsageAction(name, chem.quantity, chem.unit, "Deleted", document.getElementById("userEmail")?.innerText || "Unknown");
  saveToLocalStorage();
  displayChemicals(chemicals);
}

export function saveToLocalStorage() {
  localStorage.setItem("chemicals", JSON.stringify(chemicals));
}

export function loadFromLocalStorage() {
  const stored = localStorage.getItem("chemicals");
  if (stored) {
    chemicals = JSON.parse(stored);
    displayChemicals(chemicals);
  }
}

export function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  const mode = document.body.classList.contains("dark-mode") ? "dark" : "light";
  localStorage.setItem("theme", mode);
}

export function closeModal() {
  document.getElementById("chemicalModal").style.display = "none";
}
