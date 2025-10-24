import sector from "./data.js";

// ======== DOM Elements ========
const input = document.getElementById("accountnumber");
const validateBtn = document.querySelector(".js-validate");
const submitBtn = document.querySelector(".js-submit-data");
const confirmBtn = document.querySelector(".js-confirm-data");
const editBtn = document.querySelector(".js-edit-data");

const nameSpan = document.querySelector(".js-customer-name");
const idSpan = document.querySelector(".js-customer-id");
const select = document.getElementById("business");
const descP = document.querySelector(".js-selected-description");
const codeP = document.querySelector(".js-corresponding-code");
const bottomView = document.querySelector(".js-bottom");
const username = document.querySelector(".username")
const log = document.querySelector(".log")
const handler = localStorage.getItem('username')
const user = localStorage.getItem('username')
username.textContent = `welcome, ${user}`
// ======== Initial UI Setup ========
confirmBtn.style.display = "none";
editBtn.style.display = "none";
submitBtn.disabled = true;

// ======== Token Check ========
const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "login.html";
}

const authHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
};
// ======== Log out function =======
log.addEventListener('click',(e)=>{
    e.preventDefault()
    logout()
    alert(`logged out successfully`)
    setTimeout(() => {
        window.location.href = "login.html"
    }, 1000);
})

// ======== Populate sector dropdown ========
sector.forEach(item => {
    if (!item.sectorDescription) return;
    const option = document.createElement("option");
    option.value = item.sectorDescription;
    option.textContent = item.sectorDescription;
    select.appendChild(option);
});

select.addEventListener("change", () => {
    const selectedObj = sector.find(item => item.sectorDescription === select.value);
    if (selectedObj) {
        descP.textContent = selectedObj.sectorDescription;
        codeP.textContent = selectedObj.sectorCode;
    } else {
        descP.textContent = "Sector Description";
        codeP.textContent = "Sector Code";
    }
});

// ======== Collect Customer Data ========
function collectCustomerData() {
    return {
        name: nameSpan.textContent || "",
        account_number: input.value.trim() || "",
        sector: descP.textContent || "",
        customer_id: idSpan.textContent || "",
        business: select.value || "",
        sector_code: codeP.textContent || "",
        handled_by: handler
    };
}

// ======== Validate Account ========
validateBtn.addEventListener("click", async () => {
    const accNumber = input.value.trim();
    if (accNumber.length !== 10) {
        alert("Invalid account number");
        return;
    }

    bottomView.style.display = "flex";

    try {
        // 1️⃣ Validate with external API
        const validateRes = await fetch("http://localhost:3000/check/validate", {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({ accountNumber: accNumber })
        });

        if (!validateRes.ok) throw new Error("Validation API error");

        const validateData = await validateRes.json();

        let externalCustomer = validateData.data || {};
        nameSpan.textContent = externalCustomer.accountName || "Not Found";
        idSpan.textContent = externalCustomer.custNumber || "---";
        input.value = externalCustomer.accountNumber || "";

        // 2️⃣ Check if customer exists in DB
        let existsData = { results: [] };
        try {
            const existsRes = await fetch("http://localhost:3000/api/fetch-user-info", {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({ account_number: externalCustomer.accountNumber })
            });

            existsData = existsRes.ok ? await existsRes.json() : { results: [] };
        } catch {
            existsData.results = [];
        }

        if (existsData.results.length > 0) {
            const customer = existsData.results[0];
            // Fill DB info for existing customer
            nameSpan.textContent = customer.name || "Not Found";
            idSpan.textContent = customer.customer_id || "---";
            descP.textContent = customer.sector || "";
            codeP.textContent = customer.sector_code || "";
            select.value = customer.business || "";

            submitBtn.style.display = "none";
            select.disabled = true;

            // Edit / Confirm logic
            editBtn.style.display = "block";
            editBtn.addEventListener("click", (e) => {
                e.preventDefault();
                confirmBtn.style.display = "block";
                select.disabled = false;
            });

            confirmBtn.addEventListener("click", async () => {
                await confirmEdit();
                setTimeout(() => {
                    confirmBtn.style.display = "none";
                    select.disabled = true;
                }, 1000);
            });
        } else {
            // New customer
            descP.textContent = "";
            codeP.textContent = "";
            select.value = "";
            submitBtn.disabled = false;
            submitBtn.style.opacity = 1;
            editBtn.style.display = "none";
            setTimeout(() => { editBtn.style.display = "block"; }, 2000);
        }
    } catch (err) {
        console.error("Error during validation/check:", err);
        nameSpan.textContent = "Error";
        idSpan.textContent = "---";
        submitBtn.disabled = true;
        submitBtn.style.opacity = 0.5;
    }
});

// ======== Submit New Customer ========
submitBtn.addEventListener("click", async () => {
    const customerData = collectCustomerData();

    const missing = Object.entries(customerData).filter(([_, val]) => !val);
    if (missing.length > 0) {
        alert(`Please fill all fields before sending. Missing: ${missing.map(m => m[0]).join(", ")}`);
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/api/create", {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify(customerData)
        });

        const data = await res.json();
        console.log("Backend response:", data);

        if (res.ok) {
            alert("Customer data successfully sent!");
            submitBtn.disabled = true;
            submitBtn.style.opacity = 0.5;
        } else {
            alert(`Failed to send data: ${data.message || "Unknown error"}`);
        }
    } catch (err) {
        console.error("Error sending customer data:", err);
        alert("Error sending data. Check console for details.");
    }
});

// ======== Edit Existing Customer ========
async function confirmEdit() {
    const payload = {
        customer_id: idSpan.textContent.trim(),
        business: select.value.trim(),
        handled_by: handler
    };

    try {
        const response = await fetch("http://localhost:3000/api/edit-user-info", {
            method: "PATCH",
            headers: authHeaders,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error(`HTTP error: ${response.status}`);
            alert(`Error updating user data (status ${response.status})`);
            return;
        }

        const data = await response.json();
        console.log("✅ Response from backend:", data);
        alert("✅ User data updated successfully!");
    } catch (error) {
        console.error("❌ Network or server error:", error);
        alert("❌ Failed to connect to the server. Please try again later.");
    }
}
async function logout (){
    localStorage.clear()
}