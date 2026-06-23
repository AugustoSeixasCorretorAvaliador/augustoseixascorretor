(function () {
  const STORAGE_KEY = "site-corretor2026-imoveis";
  const seed = Array.isArray(window.IMOVEIS_SEED) ? window.IMOVEIS_SEED : [];
  const saved = localStorage.getItem(STORAGE_KEY);
  let properties = saved ? JSON.parse(saved) : seed;

  const listing = document.querySelector("#listing");
  const totalCount = document.querySelector("#totalCount");
  const dialog = document.querySelector("#propertyDialog");
  const detail = document.querySelector("#propertyDetail");
  const filters = document.querySelector("#filters");
  const fields = {
    q: document.querySelector("#q"),
    purpose: document.querySelector("#purpose"),
    type: document.querySelector("#type"),
    city: document.querySelector("#city")
  };

  function unique(name) {
    return [...new Set(properties.map((item) => item[name]).filter(Boolean))].sort();
  }

  function fillSelect(select, values) {
    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.append(option);
    });
  }

  function statusLabel(status) {
    const labels = {
      "sob-proposta": "Sob proposta",
      reservado: "Reservado",
      vendido: "Vendido",
      alugado: "Alugado",
      indisponivel: "Indispon\u00edvel",
      "em-breve": "Em Breve",
      oculto: "Oculto"
    };
    return labels[status] || "Dispon\u00edvel";
  }

  function facts(item) {
    return [
      item.area,
      item.bedrooms ? `${item.bedrooms} dorm.` : "",
      item.suites ? `${item.suites} suite${item.suites > 1 ? "s" : ""}` : "",
      item.bathrooms ? `${item.bathrooms} banho` : "",
      item.parking ? `${item.parking} vaga` : "",
      `Ref. ${item.ref}`
    ].filter(Boolean);
  }

  function money(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const amount = raw.replace(/^R\$\s*/i, "");
    if (/^\d{1,3}(\.\d{3})*,\d{2}$/.test(amount)) return `R$ ${amount}`;
    if (/^\d{1,3}(\.\d{3})+$/.test(amount)) return `R$ ${amount},00`;
    return raw;
  }

  function costs(item) {
    return [
      item.condo ? `Condominio: ${money(item.condo)}` : "",
      item.iptu ? `IPTU: ${money(item.iptu)}` : ""
    ].filter(Boolean);
  }

  function costsHtml(item) {
    const items = costs(item);
    return items.length ? `<div class="costs">${items.map((cost) => `<span>${cost}</span>`).join("")}</div>` : "";
  }

  function card(item) {
    const el = document.createElement("article");
    el.className = "property-card";
    el.tabIndex = 0;
    el.innerHTML = `
      <img src="${item.images?.[0] || ""}" alt="${item.title}">
      <div class="card-body">
        <span class="status ${item.status}">${statusLabel(item.status)}</span>
        <h2>${item.type}, ${item.neighborhood}</h2>
        <span class="price">${money(item.price) || "Consulte"}</span>
        ${costsHtml(item)}
        <p>${item.summary || ""}</p>
        <div class="facts">${facts(item).map((fact) => `<span>${fact}</span>`).join("")}</div>
      </div>`;
    el.addEventListener("click", () => openDetail(item));
    el.addEventListener("keydown", (event) => {
      if (event.key === "Enter") openDetail(item);
    });
    return el;
  }

  function filtered() {
    const q = fields.q.value.trim().toLowerCase();
    return properties.filter((item) => item.status !== "oculto").filter((item) => {
      const haystack = [item.ref, item.title, item.type, item.city, item.neighborhood, item.summary].join(" ").toLowerCase();
      return (!q || haystack.includes(q)) &&
        (!fields.purpose.value || item.purpose === fields.purpose.value) &&
        (!fields.type.value || item.type === fields.type.value) &&
        (!fields.city.value || item.city === fields.city.value);
    });
  }

  function render() {
    const items = filtered();
    listing.replaceChildren(...items.map(card));
    totalCount.textContent = `${items.length} ${items.length === 1 ? "imovel" : "imoveis"}`;
  }

  function openDetail(item) {
    location.hash = `imovel-${item.id}`;
    detail.innerHTML = `
      <section class="detail">
        <div class="gallery">${(item.images || []).map((src) => `<img src="${src}" alt="${item.title}">`).join("")}</div>
        <div class="detail-info">
          <span class="status ${item.status}">${statusLabel(item.status)}</span>
          <h1>${item.title}</h1>
          <span class="price">${money(item.price) || "Consulte"}</span>
          ${costsHtml(item)}
          <div class="facts">${facts(item).map((fact) => `<span>${fact}</span>`).join("")}</div>
          <p>${item.description || item.summary || ""}</p>
          <ul class="feature-list">${(item.features || []).map((feature) => `<li>${feature}</li>`).join("")}</ul>
          <a class="whatsapp" target="_blank" rel="noreferrer" href="https://wa.me/5521985653880?text=${encodeURIComponent(`Ola, quero informacoes sobre o imovel Ref. ${item.ref} - ${item.title}`)}">Tenho interesse</a>
        </div>
      </section>`;
    dialog.showModal();
  }

  document.querySelector("[data-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    if (location.hash.startsWith("#imovel-")) history.replaceState(null, "", location.pathname);
  });
  filters.addEventListener("input", render);
  filters.addEventListener("reset", () => setTimeout(render));

  fillSelect(fields.purpose, [...new Set(["Venda", "Aluguel", "Permuta", ...unique("purpose")])]);
  fillSelect(fields.type, unique("type"));
  fillSelect(fields.city, unique("city"));
  render();

  const hashId = location.hash.replace("#imovel-", "");
  const initial = properties.find((item) => item.id === hashId);
  if (initial) openDetail(initial);
})();
