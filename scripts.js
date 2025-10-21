import sector from "./data.js";

const input = document.getElementById("accountnumber");
const button = document.querySelector(".js-validate");
const nameSpan = document.querySelector(".js-customer-name");
const idSpan = document.querySelector(".js-customer-id");

const select = document.getElementById("business");
const descP = document.querySelector(".js-selected-description");
const codeP = document.querySelector(".js-corresponding-code");
const bottomView = document.querySelector(".js-bottom");

button.addEventListener("click", async () => {
  const accNumber = input.value.trim();

  if (accNumber.length !== 10) {
    alert("Invalid account number");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/check/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accountNumber: accNumber }),
    });

    if (!response.ok) {
        throw new Error("Network response was not okay");
    }

    bottomView.style.display = "flex";

    const resJson = await response.json();
    console.log(resJson)

    // Check if backend returned decrypted data
    if (resJson.success && resJson.data) {
      const customer = resJson.data; // already decrypted from backend

      nameSpan.textContent = customer.accountName || "Not Found";
      idSpan.textContent = customer.custNumber || "---"; // use custNumber
    } else {
      nameSpan.textContent = "Not Found";
      idSpan.textContent = "---";
    }
  } catch (error) {
    console.error("Error fetching customer data", error);
    nameSpan.textContent = "Error";
    idSpan.textContent = "---";
  }
});

// Populate sector dropdown
sector.forEach(item => {
  if (!item.sectorDescription) return;

  const option = document.createElement("option");
  option.value = item.sectorDescription;
  option.textContent = item.sectorDescription;
  select.appendChild(option);
});

// Update sector description and code
select.addEventListener("change", () => {
  const selectedDescription = select.value;
  const selectedObj = sector.find(item => item.sectorDescription === selectedDescription);

  if (selectedObj) {
    descP.textContent = selectedObj.sectorDescription;
    codeP.textContent = selectedObj.sectorCode;
  } else {
    descP.textContent = "Sector Description";
    codeP.textContent = "Sector Code";
  }
});


// function to populate data
async function update(){

}