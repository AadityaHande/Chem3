const commonChemicals = ["Water", "Oxygen", "Carbon Dioxide", "Methane", "Ethanol", "Glucose", "Sulfuric Acid", "Acetic Acid", "Sodium Chloride", "Ammonia"];

document.addEventListener("DOMContentLoaded", loadChemicals);

async function loadChemicals() {
    const list = document.getElementById("chemicalList");
    list.innerHTML = "";
    document.getElementById("searchResult").classList.add("hidden");
    document.getElementById("title").innerText = "List of Chemicals";
    
    for (let chemical of commonChemicals) {
        try {
            let apiUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${chemical}/property/MolecularFormula,MolecularWeight/JSON`;
            let response = await fetch(apiUrl);
            if (!response.ok) throw new Error("Failed to fetch");
            let data = await response.json();
            let properties = data.PropertyTable.Properties[0];
            
            let item = document.createElement("div");
            item.className = "chemical-item";
            item.innerHTML = `<h3>${chemical}</h3><p><strong>Formula:</strong> ${properties.MolecularFormula}</p><p><strong>Weight:</strong> ${properties.MolecularWeight}</p>`;
            list.appendChild(item);
        } catch (error) {
            console.error(`Error fetching ${chemical}:`, error);
        }
    }
}

async function fetchChemicalData() {
    let chemicalName = document.getElementById("chemicalSearch").value;
    if (!chemicalName) {
        alert("Please enter a chemical name.");
        return;
    }
    let apiUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${chemicalName}/property/MolecularFormula,MolecularWeight/JSON`;
    try {
        let response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Chemical not found");
        let data = await response.json();
        let properties = data.PropertyTable.Properties[0];
        
        document.getElementById("chemicalList").innerHTML = "";
        document.getElementById("title").innerText = `Results for ${chemicalName}`;
        let resultDiv = document.getElementById("searchResult");
        resultDiv.innerHTML = `
            <div class="chemical-item">
                <h3>${chemicalName}</h3>
                <p><strong>Molecular Formula:</strong> ${properties.MolecularFormula}</p>
                <p><strong>Molecular Weight:</strong> ${properties.MolecularWeight}</p>
            </div>
        `;
        resultDiv.classList.remove("hidden");
    } catch (error) {
        document.getElementById("searchResult").innerHTML = `<p style='color:red;'>Error: ${error.message}</p>`;
    }
}

function goBack() {
    window.history.back();
}
