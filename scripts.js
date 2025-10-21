import sector from "./data.js";


const input = document.getElementById("accountnumber");
const button = document.querySelector(".js-validate");
const nameSpan = document.querySelector(".js-customer-name");
const idSpan = document.querySelector(".js-customer-id");

const select = document.getElementById("business");
const descP = document.querySelector(".js-selected-description");
const codeP = document.querySelector(".js-corresponding-code");

button.addEventListener( "click", async () => {
    const accNumber = Number(input.value);

    try {
        const res = await fetch("./datax.json");
        if (!res.ok) throw new Error("Network response was not okay");

        const customers = await res.json();
        const customer = customers.find( c => c.accountNumber === accNumber);

        if (customer) {
            nameSpan.textContent = customer.name;
            idSpan.textContent = customer.customerId;
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

sector.forEach( (item) => {
    if (!item.sectorDescription) return;

    const option = document.createElement("option");
    option.value = item.sectorDescription;
    option.textContent = item.sectorDescription;
    select.appendChild(option);
});

select.addEventListener( "change", () => {
    const selectedDescripton = select.value;
    
    const selectedObj = sector.find( item => item.sectorDescription === selectedDescripton);

    if (selectedObj) {
        descP.textContent = selectedObj.sectorDescription;
        codeP.textContent = selectedObj.sectorCode;
    } else {
        descP.textContent = "Sector Description";
        codeP.textContent = "Sector Code";
    }
});