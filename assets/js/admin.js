(function () {
  const STORAGE_KEY = "site-corretor2026-imoveis";
  let properties = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || structuredClone(window.IMOVEIS_SEED || []);
  let selectedId = properties[0]?.id || "";

  const itemsEl = document.querySelector("#adminItems");
  const form = document.querySelector("#propertyForm");
  const formTitle = document.querySelector("#formTitle");

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

  function fillForm() {
    const item = current();
    if (!item) return;
    formTitle.textContent = `Editar ${item.ref}`;
    Object.entries(item).forEach(([key, value]) => {
      const field = form.elements[key];
      if (!field) return;
      if (field.type === "checkbox") field.checked = Boolean(value);
      else if (Array.isArray(value)) field.value = key === "images" ? value.join("\n") : value.join(", ");
      else field.value = value ?? "";
    });
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
