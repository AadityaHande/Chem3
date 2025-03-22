// usage.js

// --- Firebase Integration ---
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Monitor authentication state and update the user info in the navbar
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Update name and email from Firebase Auth
    document.getElementById("userName").textContent = user.displayName || "User";
    document.getElementById("userEmail").textContent = user.email;
    // Optionally update user avatar if available:
    if (user.photoURL) {
      document.getElementById("userAvatar").src = user.photoURL;
    }
    // Fetch the user role from Firestore
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        document.getElementById("userRole").textContent = userData.role || "-";
      } else {
        document.getElementById("userRole").textContent = "-";
      }
    } catch (err) {
      console.error("Error fetching user role:", err);
      document.getElementById("userRole").textContent = "-";
    }
  } else {
    // If not logged in, redirect to login
    window.location.href = "./login-a.html";
  }
});

// Logout functionality
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    signOut(auth)
      .then(() => {
        window.location.href = "./login-a.html";
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  });
}

// --------------------------
// Existing Chemical Management Code
// --------------------------

let chemicals = JSON.parse(localStorage.getItem("chemicals")) || [];

function back_btn(){
  window.history.back();
}

function searchChemicals() {
  let searchQuery = document.getElementById("searchBar").value.toLowerCase();
  let filteredChemicals = chemicals.filter(chem => chem.name.toLowerCase().includes(searchQuery));
  displayChemicals(filteredChemicals);
}

function sortChemicals() {
  let sortBy = document.getElementById("sort").value;
  if (sortBy === "low-quantity") {
    chemicals.sort((a, b) => a.quantity - b.quantity);
  } else if (sortBy === "high-quantity") {
    chemicals.sort((a, b) => b.quantity - a.quantity);
  } else if (sortBy === "latest-time") {
    chemicals.sort((a, b) => new Date(b.time) - new Date(a.time));
  }
  saveToLocalStorage();
  displayChemicals(chemicals);
}

function displayChemicals(list) {
  const chemicalList = document.getElementById("chemicalList");
  chemicalList.innerHTML = "";
  list.forEach(chem => {
    chemicalList.innerHTML += `
      <li class="chemical-item">
        <span>${chem.name} - ${chem.quantity} ${chem.unit}</span>
        <div>
          <button class="edit-btn" onclick="editChemical('${chem.name}')">Edit</button>
          <button class="add-btn" onclick="addQuantity('${chem.name}')">Add</button>
          <button class="delete-btn" onclick="deleteChemical('${chem.name}')">Delete</button>
        </div>
      </li>`;
  });
}

function addChemical() {
  if (!window.allowedToEdit) {
    alert("You do not have permission to add chemicals.");
    return;
  }
  let name = prompt("Enter chemical name:");
  let quantity = parseFloat(prompt("Enter quantity:"));
  let unit = prompt("Enter unit (ml, litre, g, kg, etc.):").toLowerCase();
  let time = new Date().toISOString();

  if (!name || isNaN(quantity) || !unit) {
    alert("Invalid input!");
    return;
  }

  let exists = chemicals.some(chem => chem.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    alert("Chemical already exists!");
    return;
  }

  chemicals.push({ name, quantity, unit, time });
  logUsageAction(name, quantity, unit, "Added", document.getElementById("userEmail").innerText);
  saveToLocalStorage();
  displayChemicals(chemicals);
}

function editChemical(name) {
  let chemical = chemicals.find(chem => chem.name === name);
  if (!chemical) {
    alert("Chemical not found!");
    return;
  }
  let newQuantity = parseFloat(prompt(`Enter new quantity for ${name} (${chemical.unit}):`));
  let newUnit = prompt(`Enter new unit for ${name} (${chemical.unit}):`).toLowerCase();

  if (isNaN(newQuantity) || newQuantity < 0 || !newUnit) {
    alert("Invalid input!");
    return;
  }

  chemical.quantity = newQuantity;
  chemical.unit = newUnit;
  chemical.time = new Date().toISOString();
  logUsageAction(name, newQuantity, newUnit, "Edited", document.getElementById("userEmail").innerText);
  saveToLocalStorage();
  displayChemicals(chemicals);
}

function addQuantity(name) {
  let chemical = chemicals.find(chem => chem.name === name);
  if (!chemical) {
    alert("Chemical not found!");
    return;
  }
  let additionalQuantity = parseFloat(prompt(`Enter quantity to add for ${name} (${chemical.unit}):`));
  if (isNaN(additionalQuantity) || additionalQuantity <= 0) {
    alert("Invalid quantity!");
    return;
  }
  let selectedUnit = prompt("Select unit: ml, litre, g, kg").toLowerCase();
  const validUnits = ["ml", "litre", "g", "kg"];
  if (!validUnits.includes(selectedUnit)) {
    alert("Invalid unit! Please enter ml, litre, g, or kg.");
    return;
  }
  let baseCurrent = convertToBaseUnit(chemical.quantity, chemical.unit);
  let baseNew = convertToBaseUnit(additionalQuantity, selectedUnit);

  chemical.quantity = (baseCurrent + baseNew) / convertToBaseUnit(1, selectedUnit);
  chemical.unit = selectedUnit;
  chemical.time = new Date().toISOString();
  logUsageAction(name, additionalQuantity, selectedUnit, "Quantity Added", document.getElementById("userEmail").innerText);
  saveToLocalStorage();
  displayChemicals(chemicals);
}

function deleteChemical(name) {
  if (!window.allowedToEdit) {
    alert("You do not have permission to delete chemicals.");
    return;
  }
  let chemical = chemicals.find(chem => chem.name === name);
  if (confirm(`Are you sure you want to delete ${name}?`)) {
    chemicals = chemicals.filter(chem => chem.name !== name);
    logUsageAction(name, chemical.quantity, chemical.unit, "Deleted", document.getElementById("userEmail").innerText);
    saveToLocalStorage();
    displayChemicals(chemicals);
  }
}

function saveToLocalStorage() {
  localStorage.setItem("chemicals", JSON.stringify(chemicals));
}

function loadFromLocalStorage() {
  let storedChemicals = localStorage.getItem("chemicals");
  if (storedChemicals) {
    chemicals = JSON.parse(storedChemicals);
    displayChemicals(chemicals);
  }
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  let mode = document.body.classList.contains("dark-mode") ? "dark" : "light";
  localStorage.setItem("theme", mode);
}

window.onload = function () {
  loadFromLocalStorage();
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
  }
};

function convertToBaseUnit(quantity, unit) {
  const unitConversion = {
    "ml": 1, 
    "litre": 1000,
    "g": 1, 
    "kg": 1000,
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
    action: actionType
  });
  localStorage.setItem("usageLogs", JSON.stringify(logs));
}
