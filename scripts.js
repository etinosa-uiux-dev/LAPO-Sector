import sector from "./data.js";

const input = document.getElementById("accountnumber");
const validateBtn = document.querySelector(".js-validate");
const submitBtn = document.querySelector(".js-submit-data");

const nameSpan = document.querySelector(".js-customer-name");
const idSpan = document.querySelector(".js-customer-id");
const select = document.getElementById("business");
const descP = document.querySelector(".js-selected-description");
const codeP = document.querySelector(".js-corresponding-code");
const bottomView = document.querySelector(".js-bottom");

// ---------------------- Populate sector dropdown ----------------------
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

// ---------------------- Validate button ----------------------
validateBtn.addEventListener("click", async () => {
  const accNumber = input.value.trim();
  if (accNumber.length !== 10) {
    alert("Invalid account number");
    return;
  }

  bottomView.style.display = "flex";

  try {
    // ------------------ Validate account with external API ------------------
    const validateRes = await fetch("http://localhost:3000/check/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountNumber: accNumber })
    });

    if (!validateRes.ok) throw new Error("Validation API error");

    const validateData = await validateRes.json();

    if (!validateData.success || !validateData.data) {
      nameSpan.textContent = "Not Found";
      idSpan.textContent = "---";
      submitBtn.disabled = false; // Allow onboarding even if not found externally
      submitBtn.style.opacity = 1;
      descP.textContent = "";
      codeP.textContent = "";
      select.value = "";
      return;
    }

    const externalCustomer = validateData.data;

    // Show external customer data by default
    nameSpan.textContent = externalCustomer.accountName || "Not Found";
    idSpan.textContent = externalCustomer.custNumber || "---";
    input.value = externalCustomer.accountNumber || "";

    // ------------------ Check if customer exists in DB ------------------
    let existsData = { results: [] }; // default empty
    try {
      const existsRes = await fetch("http://localhost:3000/api/fetch-user-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_number: externalCustomer.accountNumber })
      });

      if (existsRes.status === 404) {
        // Customer not in DB, proceed with onboarding
        existsData.results = [];
      } else if (!existsRes.ok) {
        throw new Error("Check-exists API error");
      } else {
        existsData = await existsRes.json();
      }
    } catch (err) {
      console.warn("Check-exists fetch error, treating as new customer:", err);
      existsData.results = []; // fallback to new customer
    }

    if (existsData.results && existsData.results.length > 0) {
      const customer = existsData.results[0];
      // Fill DB info for existing customer
      nameSpan.textContent = customer.name || "Not Found";
      idSpan.textContent = customer.customer_id || "---";
      descP.textContent = customer.sector || "";
      codeP.textContent = customer.sector_code || "";
      select.value = customer.business || "";

      // Disable submit button for existing customer
      submitBtn.disabled = true;
      submitBtn.style.opacity = 0.5;
    } else {
      // New customer — enable submit button
      descP.textContent = "";
      codeP.textContent = "";
      select.value = "";
      submitBtn.disabled = false;
      submitBtn.style.opacity = 1;
    }

  } catch (err) {
    console.error("Error during validation/check:", err);
    nameSpan.textContent = "Error";
    idSpan.textContent = "---";
    submitBtn.disabled = true;
    submitBtn.style.opacity = 0.5;
  }
});

// ---------------------- Collect customer data ----------------------
function collectCustomerData() {
  return {
    name: nameSpan.textContent || "",
    account_number: input.value.trim() || "",
    sector: descP.textContent || "",
    customer_id: idSpan.textContent || "",
    business: select.value || "",
    sector_code: codeP.textContent || ""
  };
}

// ---------------------- Submit button ----------------------
submitBtn.addEventListener("click", async () => {
  const customerData = collectCustomerData();
  console.log("Sending customer data:", customerData);

  // Prevent sending incomplete data
  const missing = Object.entries(customerData).filter(([_, val]) => !val);
  if (missing.length > 0) {
    alert(`Please fill all fields before sending. Missing: ${missing.map(m => m[0]).join(", ")}`);
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
