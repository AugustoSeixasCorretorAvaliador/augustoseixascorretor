(function () {
  const STORAGE_KEY = "site-corretor2026-imoveis";
  let properties = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || structuredClone(window.IMOVEIS_SEED || []);
  let selectedId = properties[0]?.id || "";

  const itemsEl = document.querySelector("#adminItems");
  const form = document.querySelector("#propertyForm");
  const formTitle = document.querySelector("#formTitle");
  const featuresCount = document.querySelector("#featuresCount");
  const imagePrefix = document.querySelector("#imagePrefix");
  const imageCount = document.querySelector("#imageCount");
  const generateImagesBtn = document.querySelector("#generateImagesBtn");
  const legacyLabels = {
    "sob-proposta": "Sob proposta",
    oculto: "Oculto"
  };
  const currencyFields = ["price", "condo", "iptu"];
  const currencyPattern = /^\d{1,3}(\.\d{3})*,\d{2}$/;

  function saveLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
  }

  function current() {
    return properties.find((item) => item.id === selectedId) || properties[0];
  }

  function renderList() {
    itemsEl.replaceChildren(...properties.map((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `admin-item ${item.id === selectedId ? "active" : ""}`;
      btn.innerHTML = `<strong>${item.ref} - ${item.neighborhood}</strong><span>${item.title}</span>`;
      btn.addEventListener("click", () => {
        selectedId = item.id;
        fillForm();
        renderList();
      });
      return btn;
    }));
  }

  function ensureSelectOption(field, value) {
    if (!field || field.tagName !== "SELECT" || !value) return;
    const exists = [...field.options].some((option) => option.value === value);
    if (exists) return;
    field.append(new Option(legacyLabels[value] || value, value));
  }

  function countFeatures() {
    return form.elements.features.value.split(",").map((item) => item.trim()).filter(Boolean).length;
  }

  function normalizeCurrency(value) {
    const raw = String(value || "").trim().replace(/^R\$\s*/i, "");
    if (!raw) return "";
    if (currencyPattern.test(raw)) return raw;

    const digits = raw.replace(/\D/g, "");
    if (!digits) return raw;

    const cents = raw.includes(",") ? digits.slice(-2).padStart(2, "0") : "00";
    const integerDigits = raw.includes(",") ? digits.slice(0, -2) || "0" : digits;
    const integer = Number(integerDigits).toLocaleString("pt-BR");
    return `${integer},${cents}`;
  }

  function updateFeaturesCount() {
    if (!featuresCount) return;
    const total = countFeatures();
    featuresCount.textContent = `${total} ${total === 1 ? "caracter\u00edstica cadastrada" : "caracter\u00edsticas cadastradas"}`;
  }

  function fillForm() {
    const item = current();
    if (!item) return;
    formTitle.textContent = `Editar ${item.ref}`;
    Object.entries(item).forEach(([key, value]) => {
      const field = form.elements[key];
      if (!field) return;
      if (field.type === "checkbox") field.checked = Boolean(value);
      else if (Array.isArray(value)) field.value = key === "images" ? value.join("\n") : value.join(", ");
      else {
        ensureSelectOption(field, value);
        field.value = currencyFields.includes(key) ? normalizeCurrency(value) : value ?? "";
      }
    });
    updateFeaturesCount();
  }

  function readForm() {
    const data = Object.fromEntries(new FormData(form).entries());
    return {
      ...current(),
      ...data,
      bedrooms: Number(data.bedrooms || 0),
      suites: Number(data.suites || 0),
      bathrooms: Number(data.bathrooms || 0),
      parking: Number(data.parking || 0),
      price: normalizeCurrency(data.price),
      condo: normalizeCurrency(data.condo),
      iptu: normalizeCurrency(data.iptu),
      featured: form.elements.featured.checked,
      features: data.features.split(",").map((item) => item.trim()).filter(Boolean),
      images: data.images.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
    };
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const next = readForm();
    const index = properties.findIndex((item) => item.id === selectedId);
    if (index >= 0) properties[index] = next;
    else properties.push(next);
    selectedId = next.id;
    saveLocal();
    renderList();
    fillForm();
  });

  form.elements.features.addEventListener("input", updateFeaturesCount);
  currencyFields.forEach((name) => {
    form.elements[name].addEventListener("blur", () => {
      form.elements[name].value = normalizeCurrency(form.elements[name].value);
    });
  });

  generateImagesBtn.addEventListener("click", () => {
    const prefix = imagePrefix.value.trim();
    const total = Number(imageCount.value || 0);
    if (!prefix || !Number.isInteger(total) || total < 1) {
      alert("Informe o prefixo e uma quantidade valida.");
      return;
    }
    form.elements.images.value = Array.from({ length: total }, (_, index) => {
      const suffix = String(index + 1).padStart(3, "0");
      return `assets/imoveis/${prefix}${suffix}.jpg`;
    }).join("\n");
  });

  document.querySelector("#newBtn").addEventListener("click", () => {
    const id = String(Date.now());
    properties.unshift({
      id,
      ref: "novo",
      title: "Novo imovel",
      type: "Apartamento",
      purpose: "Venda",
      city: "Niteroi",
      state: "RJ",
      neighborhood: "",
      price: "",
      condo: "",
      iptu: "",
      bedrooms: 0,
      suites: 0,
      bathrooms: 0,
      parking: 0,
      area: "",
      status: "disponivel",
      featured: false,
      summary: "",
      description: "",
      features: [],
      images: []
    });
    selectedId = id;
    saveLocal();
    renderList();
    fillForm();
  });

  document.querySelector("#duplicateBtn").addEventListener("click", () => {
    const copy = { ...readForm(), id: String(Date.now()), ref: `${form.elements.ref.value}-copia` };
    properties.unshift(copy);
    selectedId = copy.id;
    saveLocal();
    renderList();
    fillForm();
  });

  document.querySelector("#deleteBtn").addEventListener("click", () => {
    if (!confirm("Excluir este anuncio do painel local?")) return;
    properties = properties.filter((item) => item.id !== selectedId);
    selectedId = properties[0]?.id || "";
    saveLocal();
    renderList();
    fillForm();
  });

  document.querySelector("#exportBtn").addEventListener("click", () => {
    const content = `window.IMOVEIS_SEED = ${JSON.stringify(properties, null, 2)};\n`;
    const blob = new Blob([content], { type: "text/javascript;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "imoveis.js";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.querySelector("#importFile").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const text = await file.text();
    const jsonText = text.replace(/^window\.IMOVEIS_SEED\s*=\s*/, "").replace(/;\s*$/, "");
    properties = JSON.parse(jsonText);
    selectedId = properties[0]?.id || "";
    saveLocal();
    renderList();
    fillForm();
  });

  renderList();
  fillForm();
})();
