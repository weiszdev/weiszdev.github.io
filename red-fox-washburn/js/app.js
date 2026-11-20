(function () {
  const MENU = window.REDFOX_MENU || [];
  const TAX_RATE = 0.05;
  const MEATS = ["Bacon", "Sausage Links", "Sausage Patties", "Ham"];
  const EGGS = ["Scrambled", "Over Easy", "Over Medium", "Over Hard", "Sunny Side Up"];
  const TOASTS = ["White", "Wheat", "Sourdough"];
  const CAKES = ["Sweet Cream Pancakes", "Golden French Toast"];
  const DRESSINGS = ["Ranch", "Honey Mustard", "Balsamic Vinaigrette", "Blue Cheese"];
  const CHOCOLATES = ["White chocolate", "Dark chocolate"];
  const BASES_MENU = ["Latte", "Cold Brew"];
  const MILKS = ["Lotus Non-Dairy Creamer", "2%", "Half & Half", "Oat Milk", "None"];
  const SYRUPS = ["Vanilla", "Caramel", "Brown Sugar", "Toasted Marshmallow", "Salted Caramel", "Coconut", "Pumpkin Pie", "Crème de Banana"];
  const SYRUP_COLOR = {
    Vanilla: "#E7D7A8",
    Caramel: "#D48834",
    "Brown Sugar": "#8C5A32",
    "Toasted Marshmallow": "#F3C7B0",
    "Salted Caramel": "#C47A3A",
    Coconut: "#F4EFE2",
    "Pumpkin Pie": "#E08A2C",
    "Crème de Banana": "#F0D34A"
  };
  const STUDIO_BASES = {
    pink: { name: "Pink Lotus", liquid: "#E4548A", deep: "#C22562", swirl: "#F8D0E0" },
    white: { name: "White Lotus", liquid: "#F7F3EA", deep: "#E4D5BE", swirl: "#FFFFFF" },
    blue: { name: "Blue Lotus", liquid: "#3C7DFF", deep: "#1C4ED8", swirl: "#D9E7FF" },
    latte: { name: "Espresso Latte", liquid: "#C99668", deep: "#6B4632", swirl: "#F6E7D4" },
    coldbrew: { name: "Cold Brew", liquid: "#4A2E22", deep: "#26160F", swirl: "#E6D0BF" }
  };
  const PRESETS = {
    foxy: {
      name: "Feeling Foxy", base: "pink", size: "16", tier: "standard", syrups: [],
      milk: "Lotus Non-Dairy Creamer", shot: false, foam: false, includedFoam: false, drizzle: false,
      notes: [{ name: "Red dragon fruit", color: "#E23D78" }, { name: "Peach", color: "#F4A27A" }],
      image: "./images/lotus-drinks.jpg"
    },
    wicked: {
      name: "Wicked Den", base: "white", size: "16", tier: "signature", syrups: ["Caramel"],
      milk: "None", shot: false, foam: false, includedFoam: true, drizzle: true,
      notes: [{ name: "Green apple", color: "#8FCB6B" }, { name: "Caramel cold foam", color: "#E0A04A" }],
      image: "./images/lotus-drinks.jpg"
    },
    summer: {
      name: "Summertime Blues", base: "blue", size: "16", tier: "standard", syrups: [],
      milk: "Lotus Non-Dairy Creamer", shot: false, foam: false, includedFoam: false, drizzle: false,
      notes: [{ name: "Blue raspberry", color: "#6AA7FF" }, { name: "Desert pear", color: "#F2C14E" }],
      image: "./images/lotus-drinks.jpg"
    },
    banana: {
      name: "Shaken Banana", base: "latte", size: "16", tier: "signature", syrups: ["Brown Sugar"],
      milk: "Oat Milk", shot: false, foam: false, includedFoam: true, drizzle: true,
      notes: [{ name: "Banana cold foam", color: "#F0D34A" }],
      image: "./images/coffee-drinks.jpg"
    },
    mistletoe: {
      name: "Mistletoe Lotus", base: "white", size: "16", tier: "signature", syrups: [],
      milk: "None", shot: false, foam: false, includedFoam: false, drizzle: false,
      notes: [{ name: "Cranberry", color: "#C23B4E" }, { name: "Sprite", color: "#D9F5C8" }],
      image: "./images/seasonal-drinks.jpg"
    }
  };
  const LADDER = {
    standard: { 16: 600, 24: 750, 32: 900 },
    signature: { 16: 700, 24: 850, 32: 1000 }
  };
  const DAY_NAME = { Sun: "Sunday", Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday" };
  const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const SUB_ORDER = [
    "Breakfast Favorites", "Fresh Baked Goods", "Specialty Breakfast", "Omelettes", "Silver Fox / Kids Breakfast",
    "Burgers & Sandwiches", "Wraps", "Salads", "Homestyle Dinners", "Baskets", "Silver Fox / Kids Lunch",
    "Lotus Drinks", "Coffee Drinks", "Signature Drinks", "Seasonal Sips"
  ];

  const state = {
    tab: "featured",
    sub: "all",
    chip: "all",
    query: "",
    cart: [],
    busy: 15,
    eightysix: false,
    seasonalLive: true,
    fulfillment: "asap",
    slot: "",
    draft: null,
    studio: null,
    orderTimer: null,
    lastFocus: null
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }

  function receipt(cents) {
    const sign = cents < 0 ? "-" : "";
    const abs = Math.abs(cents);
    return `${sign}$${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
  }

  function menuMoney(cents) {
    if (cents % 100 === 0) return `$${cents / 100}`;
    return receipt(cents);
  }

  function chicagoParts(date) {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    });
    const bag = {};
    for (const part of dtf.formatToParts(date)) bag[part.type] = part.value;
    let hour = parseInt(bag.hour, 10);
    if (hour === 24) hour = 0;
    const minute = parseInt(bag.minute, 10);
    return { weekday: bag.weekday, hour, minute, minutes: hour * 60 + minute };
  }

  function formatClock(hour, minute) {
    const ampm = hour >= 12 ? "PM" : "AM";
    let h = hour % 12;
    if (h === 0) h = 12;
    return `${h}:${String(minute).padStart(2, "0")} ${ampm}`;
  }

  function openWindow(weekday) {
    return { start: weekday === "Sun" ? 9 * 60 : 7 * 60, end: 14 * 60 };
  }

  function statusFor(date) {
    const now = chicagoParts(date);
    const windowForDay = openWindow(now.weekday);
    const open = now.minutes >= windowForDay.start && now.minutes < windowForDay.end;
    let headline;
    if (open) {
      headline = "Open now · until 2:00 PM CT";
    } else if (now.minutes < windowForDay.start) {
      headline = `Closed · opens at ${formatClock(Math.floor(windowForDay.start / 60), windowForDay.start % 60)} CT`;
    } else {
      const next = WEEK[(WEEK.indexOf(now.weekday) + 1) % 7];
      const nextWindow = openWindow(next);
      headline = `Closed · opens ${DAY_NAME[next]} at ${formatClock(Math.floor(nextWindow.start / 60), 0)} CT`;
    }
    return {
      open,
      now,
      headline,
      clock: `${DAY_NAME[now.weekday] || now.weekday} · ${formatClock(now.hour, now.minute)} CT`
    };
  }

  function etaText() {
    if (state.busy === 25) return "Est. 25 min";
    if (state.busy === 40) return "Est. 40 min";
    return "Est. 12–15 min";
  }

  function inTab(item, tab) {
    if (tab === "full") return true;
    if (tab === "featured") return !!(item.featured || item.popular);
    if (tab === "coffee") return item.group === "coffee" || item.group === "signature";
    return item.group === tab;
  }

  function minCents(item) {
    if (item.sizes) return Math.round(Math.min(...item.sizes.map((s) => s.price)) * 100);
    return Math.round(item.price * 100);
  }

  function holdState(item) {
    if (item.id === "caramel-roll" && state.eightysix) return "86";
    if (item.group === "seasonal" && !state.seasonalLive) return "held";
    return null;
  }

  function badgesFor(item) {
    const badges = [];
    if (item.id === "hot-hamburger") badges.push(["Local Favorite", "local"]);
    else if (item.group === "seasonal") badges.push(["Seasonal", "seasonal"]);
    else if (item.popular) badges.push(["Fan Favorite", ""]);
    if (item.vegetarian) badges.push(["Vegetarian", "veg"]);
    else if (item.group === "signature" || item.id === "wicked-den") badges.push(["Signature", "sig"]);
    else if (item.opts && item.opts.length) badges.push(["Customizable", ""]);
    return badges.slice(0, 2);
  }

function drinkMoney(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function priceLine(item) {
  if (item.sizes) {
    const bits = item.sizes.map((size) => `${size.label} ${drinkMoney(size.price)}`).join(" · ");
    return `<span class="price">${drinkMoney(item.sizes[0].price)}<small>${bits}</small></span>`;
  }
    if (item.fixedSize) {
      return `<span class="price">${menuMoney(Math.round(item.price * 100))}<small>${esc(item.fixedSize)}</small></span>`;
    }
    return `<span class="price">${menuMoney(Math.round(item.price * 100))}</span>`;
  }

  function filtered() {
    const q = state.query.trim().toLowerCase();
    return MENU.filter((item) => {
      if (!inTab(item, state.tab)) return false;
      if (state.sub !== "all" && item.sub !== state.sub) return false;
      if (state.chip === "popular" && !item.popular) return false;
      if (state.chip === "under" && minCents(item) >= 1000) return false;
      if (state.chip === "veg" && !item.vegetarian) return false;
      if (!q) return true;
      const hay = `${item.name} ${item.desc} ${item.sub}`.toLowerCase();
      return hay.includes(q);
    });
  }

  function subsForTab() {
    const present = new Set(MENU.filter((item) => inTab(item, state.tab)).map((item) => item.sub));
    return SUB_ORDER.filter((sub) => present.has(sub));
  }

  function renderCounts() {
    $$("[data-count]").forEach((node) => {
      const tab = node.dataset.count;
      node.textContent = String(MENU.filter((item) => inTab(item, tab)).length);
    });
  }

  function renderSubs() {
    const host = $("#menu-subs");
    const subs = subsForTab();
    if (!subs.includes(state.sub)) state.sub = "all";
    const buttons = [`<button type="button" class="subpill" data-sub="all" aria-pressed="${state.sub === "all"}">All</button>`];
    subs.forEach((sub) => {
      const count = MENU.filter((item) => inTab(item, state.tab) && item.sub === sub).length;
      buttons.push(`<button type="button" class="subpill" data-sub="${esc(sub)}" aria-pressed="${state.sub === sub}">${esc(sub)} <span class="count">${count}</span></button>`);
    });
    host.innerHTML = buttons.join("");
  }

  function renderMenu() {
    const grid = $("#menu-grid");
    const items = filtered();
    const meta = $("#menu-meta");
    meta.textContent = items.length === 1 ? "Showing 1 item" : `Showing ${items.length} items`;
    if (!items.length) {
      const broad = MENU.some((item) => {
        const q = state.query.trim().toLowerCase();
        if (!q) return false;
        return `${item.name} ${item.desc}`.toLowerCase().includes(q);
      });
      grid.innerHTML = `<div class="empty"><p>Nothing in this tab matches.</p>${broad ? `<button class="btn btn-ink" type="button" id="search-all">Search the full menu</button>` : ""}</div>`;
      return;
    }
    grid.innerHTML = items.map((item) => {
      const hold = holdState(item);
      const badges = badgesFor(item).map(([label, kind]) => `<span class="badge ${kind}">${esc(label)}</span>`).join("");
      const quote = item.quote ? `<blockquote>“${esc(item.quote)}”</blockquote>` : "";
      const service = item.service ? `<p class="service-line">${esc(item.service)}</p>` : "";
      const holdLabel = hold === "86" ? "86’d today" : hold === "held" ? "Held for launch" : "";
      return `<article class="card" data-id="${esc(item.id)}" data-price="${item.price}">
        ${hold ? `<div class="hold-flag">${holdLabel}</div>` : ""}
        <button class="card-open" type="button" data-open="${esc(item.id)}">
          <span class="card-media">
            <span class="badges">${badges}</span>
            <img src="${esc(item.image)}" alt="${esc(item.alt)}" width="1152" height="864">
          </span>
          <span class="card-body">
            <span class="kicker">${esc(item.sub)}</span>
            <h3>${esc(item.name)}${item.asterisk ? '<sup class="star">*</sup>' : ""}</h3>
            <span class="desc">${esc(item.desc)}</span>
            ${service}
            ${quote}
          </span>
        </button>
        <div class="card-foot">
          ${priceLine(item)}
          <button class="add" type="button" data-add="${esc(item.id)}" aria-label="Add ${esc(item.name)}" ${hold ? "disabled" : ""}>+ Add</button>
        </div>
      </article>`;
    }).join("");
  }

  function sauceChoices(item) {
    if (item.foxSauce) return ["Fox Burger Sauce", "Ranch", "BBQ", "Honey Mustard", "Mayonnaise", "No sauce"];
    return ["Ranch", "BBQ", "Honey Mustard", "Honey Garlic", "Mayonnaise"];
  }

  function defaultMods(item) {
    const mods = {
      sizeId: item.sizes ? "16" : null,
      size: item.sizes ? "16 oz" : (item.fixedSize || null),
      temp: item.opts.includes("temp") ? (item.tempDefault === "hot" ? "Hot" : "Iced") : null,
      milk: item.opts.includes("milk") ? (item.milkDefault || "2%") : null,
      syrups: item.syrupDefault ? item.syrupDefault.slice() : [],
      shot: false,
      foam: false,
      drizzle: !!item.drizzle,
      meat: item.opts.includes("meat") ? "Bacon" : null,
      eggs: item.opts.includes("eggs") ? "Scrambled" : null,
      toast: item.opts.includes("toast") ? "White" : null,
      cake: item.opts.includes("cake") ? "Sweet Cream Pancakes" : null,
      bacon: false,
      hash: false,
      steak: false,
      sauce: item.opts.includes("sauce") ? (item.sauceDefault || "Ranch") : null,
      dressing: item.opts.includes("dressing") ? (item.dressingDefault || "Ranch") : null,
      chocolate: item.opts.includes("chocolate") ? "White chocolate" : null,
      base: item.opts.includes("base") ? (item.baseDefault || "Latte") : null,
      notes: ""
    };
    if (mods.base === "Cold Brew") mods.temp = "Iced";
    return mods;
  }

  function priceCents(item, mods) {
    let cents = item.sizes
      ? Math.round(item.sizes.find((s) => s.id === mods.sizeId).price * 100)
      : Math.round(item.price * 100);
    if (mods.bacon) cents += 200;
    if (mods.hash) cents += 300;
    if (mods.steak) cents += 500;
    if (mods.shot) cents += 100;
    if (mods.foam) cents += 100;
    return cents;
  }

  function summarize(mods) {
    const parts = [];
    if (mods.size) parts.push(mods.size);
    if (mods.base) parts.push(mods.base);
    if (mods.temp) parts.push(mods.temp);
    if (mods.cake) parts.push(mods.cake);
    if (mods.meat) parts.push(mods.meat);
    if (mods.eggs) parts.push(mods.eggs);
    if (mods.toast) parts.push(`${mods.toast} toast`);
    if (mods.chocolate) parts.push(mods.chocolate);
    if (mods.milk && mods.milk !== "None") parts.push(mods.milk);
    if (mods.syrups && mods.syrups.length) parts.push(mods.syrups.join(", "));
    if (mods.sauce && mods.sauce !== "No sauce") parts.push(mods.sauce);
    if (mods.sauce === "No sauce") parts.push("No sauce");
    if (mods.dressing) parts.push(mods.dressing);
    if (mods.bacon) parts.push("Add bacon");
    if (mods.hash) parts.push("Add hashbrowns");
    if (mods.steak) parts.push("Extra steak");
    if (mods.shot) parts.push("Extra shot");
    if (mods.foam) parts.push("Cold foam");
    if (mods.drizzle) parts.push("Caramel drizzle");
    if (mods.notes) parts.push(`Note: ${mods.notes}`);
    return parts;
  }

  function choiceButtons(group, label, values, current) {
    return `<fieldset><legend>${esc(label)}</legend><div class="choice-row">${values.map((value) => {
      const on = current === value;
      return `<button type="button" data-choice data-group="${esc(group)}" data-value="${esc(value)}" aria-pressed="${on}">${esc(value)}</button>`;
    }).join("")}</div></fieldset>`;
  }

  function renderModalOptions() {
    const item = state.draft.item;
    const mods = state.draft.mods;
    const chunks = [];
    if (item.opts.includes("size")) {
      chunks.push(`<fieldset><legend>Size</legend><div class="choice-row">${item.sizes.map((size) => {
        const on = mods.sizeId === size.id;
        return `<button type="button" data-choice data-group="size" data-value="${esc(size.id)}" aria-pressed="${on}">${esc(size.label)} · ${receipt(Math.round(size.price * 100))}</button>`;
      }).join("")}</div></fieldset>`);
    }
    if (item.opts.includes("base")) chunks.push(choiceButtons("base", "Latte or cold brew", BASES_MENU, mods.base));
    if (item.opts.includes("temp")) chunks.push(choiceButtons("temp", "Hot or iced", ["Hot", "Iced"], mods.temp));
    if (item.opts.includes("cake")) chunks.push(choiceButtons("cake", "Pancakes or French toast", CAKES, mods.cake));
    if (item.opts.includes("meat")) chunks.push(choiceButtons("meat", "Choice of meat", MEATS, mods.meat));
    if (item.opts.includes("eggs")) chunks.push(choiceButtons("eggs", "Egg style", EGGS, mods.eggs));
    if (item.opts.includes("toast")) chunks.push(choiceButtons("toast", "Toast", TOASTS, mods.toast));
    if (item.opts.includes("chocolate")) chunks.push(choiceButtons("chocolate", "Chocolate", CHOCOLATES, mods.chocolate));
    if (item.opts.includes("milk")) chunks.push(choiceButtons("milk", "Milk", MILKS, mods.milk));
    if (item.opts.includes("syrup")) {
      chunks.push(`<fieldset><legend>Syrups <span class="fine">included · no sugar-free yet</span></legend><div class="choice-row">${SYRUPS.map((syrup) => {
        const on = mods.syrups.includes(syrup);
        return `<button type="button" data-choice data-group="syrup" data-value="${esc(syrup)}" aria-pressed="${on}">${esc(syrup)}</button>`;
      }).join("")}</div></fieldset>`);
    }
    if (item.opts.includes("sauce")) chunks.push(choiceButtons("sauce", "Sauce", sauceChoices(item), mods.sauce));
    if (item.opts.includes("dressing")) chunks.push(choiceButtons("dressing", "Dressing", DRESSINGS, mods.dressing));
    const checks = [];
    if (item.opts.includes("bacon")) checks.push(`<label class="check"><input type="checkbox" data-flag="bacon" ${mods.bacon ? "checked" : ""}> <span>Add bacon <em>+$2</em></span></label>`);
    if (item.opts.includes("hash")) checks.push(`<label class="check"><input type="checkbox" data-flag="hash" ${mods.hash ? "checked" : ""}> <span>Add hashbrowns <em>+$3</em></span></label>`);
    if (item.opts.includes("steak")) checks.push(`<label class="check"><input type="checkbox" data-flag="steak" ${mods.steak ? "checked" : ""}> <span>Extra steak <em>+$5</em></span></label>`);
    if (item.opts.includes("shot")) checks.push(`<label class="check"><input type="checkbox" data-flag="shot" ${mods.shot ? "checked" : ""}> <span>Extra shot <em>+$1.00</em></span></label>`);
    if (item.opts.includes("foam")) checks.push(`<label class="check"><input type="checkbox" data-flag="foam" ${mods.foam ? "checked" : ""}> <span>Add cold foam <em>+$1.00</em></span></label>`);
    if (item.opts.includes("drizzle")) checks.push(`<label class="check"><input type="checkbox" data-flag="drizzle" ${mods.drizzle ? "checked" : ""}> <span>Caramel drizzle</span></label>`);
    if (checks.length) chunks.push(`<fieldset><legend>Add-ons</legend>${checks.join("")}</fieldset>`);
    $("#modal-options").innerHTML = chunks.join("");
    syncTempLock();
  }

  function syncTempLock() {
    const hot = $('#modal-options [data-group="temp"][data-value="Hot"]');
    if (!hot || !state.draft) return;
    const lock = state.draft.mods.base === "Cold Brew";
    hot.disabled = lock;
    if (lock && state.draft.mods.temp !== "Iced") {
      state.draft.mods.temp = "Iced";
      $$('#modal-options [data-group="temp"]').forEach((btn) => {
        const on = btn.dataset.value === "Iced";
        btn.setAttribute("aria-pressed", String(on));
      });
    }
  }

  function updateModalPrice() {
    if (!state.draft) return;
    const cents = priceCents(state.draft.item, state.draft.mods) * state.draft.qty;
    $("#modal-price").textContent = receipt(cents);
    const hold = holdState(state.draft.item);
    const add = $("#modal-add");
    add.disabled = !!hold;
    add.textContent = hold === "86"
      ? "Paused — 86’d in this demo"
      : hold === "held"
        ? "Held — turn Christmas sips on"
        : `Add ${state.draft.qty} to bag · ${receipt(cents)}`;
    $("#modal-qty").textContent = String(state.draft.qty);
  }

  function openModal(id) {
    const item = MENU.find((row) => row.id === id);
    if (!item) return;
    state.lastFocus = document.activeElement;
    state.draft = { item, mods: defaultMods(item), qty: 1 };
    $("#modal-img").src = item.image;
    $("#modal-img").alt = item.alt;
    $("#modal-kicker").textContent = item.sub;
    $("#modal-title").textContent = item.asterisk ? `${item.name}*` : item.name;
    $("#modal-desc").textContent = item.desc;
    $("#modal-service").textContent = item.service || "";
    $("#modal-includes").textContent = item.includes || "";
    const quote = $("#modal-quote");
    if (item.quote) {
      quote.hidden = false;
      quote.textContent = `“${item.quote}”`;
    } else quote.hidden = true;
    $("#modal-notes").value = "";
    renderModalOptions();
    updateModalPrice();
    $("#item-dialog").showModal();
  }

  function addLine(line) {
    const key = `${line.itemId}|${line.parts.join("|")}`;
    const existing = state.cart.find((row) => row.key === key);
    if (existing) existing.qty += line.qty;
    else state.cart.push({ ...line, key, uid: `l${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}` });
    updateCartChrome();
    toast(`Added ${line.name}`);
  }

  function quickAdd(id) {
    const item = MENU.find((row) => row.id === id);
    if (!item || holdState(item)) {
      toast(item && holdState(item) === "86" ? "Jumbo Caramel Rolls are 86’d in this demo." : "That drink is held in this demo.");
      return;
    }
    const mods = defaultMods(item);
    addLine({
      itemId: item.id,
      name: item.name,
      image: item.image,
      alt: item.alt,
      qty: 1,
      unit: priceCents(item, mods),
      parts: summarize(mods),
      kind: item.group === "breakfast" || item.group === "lunch" ? "food" : "drink"
    });
  }

  function cartSubtotal() {
    return state.cart.reduce((sum, line) => sum + line.unit * line.qty, 0);
  }

  function updateCartChrome() {
    const count = state.cart.reduce((sum, line) => sum + line.qty, 0);
    $("#cart-count").textContent = String(count);
    const fab = $("#cart-fab");
    const total = receipt(cartSubtotal());
    $("#fab-count").textContent = String(count);
    $("#fab-total").textContent = total;
    if (count > 0) {
      fab.hidden = false;
      fab.classList.add("show");
    } else {
      fab.classList.remove("show");
      fab.hidden = true;
    }
    const bagLabel = `View bag, ${count} ${count === 1 ? "item" : "items"}, subtotal ${total}`;
    fab.setAttribute("aria-label", bagLabel);
    $("#header-cart").setAttribute("aria-label", `Open order bag, ${count} items, ${total}`);
    if (!$("#cart-drawer").hidden) renderCart();
  }

  function slotsFor(date) {
    const status = statusFor(date);
    const windowForDay = openWindow(status.now.weekday);
    const slots = [];
    for (let t = windowForDay.start; t < windowForDay.end; t += 15) {
      const disabled = status.now.minutes >= t;
      slots.push({ value: String(t), label: formatClock(Math.floor(t / 60), t % 60), disabled });
    }
    return { status, slots };
  }

  function renderCart() {
    const body = $("#cart-body");
    if (!state.cart.length) {
      body.innerHTML = `<p>The bag is empty. Add a hot hamburger, a caramel roll, or a Lotus drink.</p><a class="btn btn-ink" href="#menu" id="bag-to-menu">Browse the menu</a>`;
      $("#cart-foot").innerHTML = "";
      return;
    }
    const { status, slots } = slotsFor(new Date());
    if (!state.slot || !slots.some((slot) => slot.value === state.slot && !slot.disabled)) {
      const first = slots.find((slot) => !slot.disabled);
      state.slot = first ? first.value : "";
      if (!state.slot) state.fulfillment = "asap";
    }
    body.innerHTML = state.cart.map((line) => `<article class="line">
      <img src="${esc(line.image)}" alt="">
      <div>
        <h3>${esc(line.name)}</h3>
        <p class="mods">${esc(line.parts.join(" · "))}</p>
        <div class="qty">
          <button type="button" data-dec="${esc(line.uid)}" aria-label="Decrease ${esc(line.name)}">−</button>
          <span>${line.qty}</span>
          <button type="button" data-inc="${esc(line.uid)}" aria-label="Increase ${esc(line.name)}">+</button>
        </div>
        <button class="linkish" type="button" data-remove="${esc(line.uid)}">Remove</button>
      </div>
      <strong>${receipt(line.unit * line.qty)}</strong>
    </article>`).join("") + upsellHtml();

    const sub = cartSubtotal();
    const tax = Math.round(sub * TAX_RATE);
    const closedNote = status.open ? "" : `<p class="fine">The kitchen is ${esc(status.headline)}. You can still run this preview.</p>`;
    const slotOptions = slots.map((slot) => `<option value="${slot.value}" ${slot.disabled ? "disabled" : ""} ${slot.value === state.slot ? "selected" : ""}>${slot.label}${slot.disabled ? " · passed" : ""}</option>`).join("");
    $("#cart-foot").innerHTML = `
      ${closedNote}
      <div class="fulfill" role="group" aria-label="Pickup time">
        <button type="button" data-fulfill="asap" aria-pressed="${state.fulfillment === "asap"}"><strong>⚡ Immediate ASAP Pickup</strong><span data-eta>${esc(etaText())}</span></button>
        <button type="button" data-fulfill="later" aria-pressed="${state.fulfillment === "later"}" ${state.slot ? "" : "disabled"}><strong>🕒 Schedule for Later Today</strong><span>Inside today’s open hours</span></button>
      </div>
      <label class="slot-wrap" ${state.fulfillment === "later" ? "" : "hidden"}>Pickup time today
        <select class="slot-select" id="slot-select">${slotOptions}</select>
      </label>
      <div class="totals">
        <div><span>Subtotal</span><span>${receipt(sub)}</span></div>
        <div><span>Estimated tax (ND 5% state)</span><span>${receipt(tax)}</span></div>
        <div class="grand"><span>Total</span><span>${receipt(sub + tax)}</span></div>
      </div>
      <p class="fine">Local option tax, if any, would be added at the register in a live build. This demo does not charge a card.</p>
      <button class="btn btn-primary btn-block" type="button" id="place-order">Place Demo Order (Interactive Preview)</button>`;
  }

  function upsellHtml() {
    if (state.eightysix) return "";
    const hasDrink = state.cart.some((line) => line.kind === "drink");
    const hasRoll = state.cart.some((line) => line.itemId === "caramel-roll");
    if (!hasDrink || hasRoll) return "";
    return `<div class="upsell"><div><strong>Add a Jumbo Caramel Roll</strong><p class="mods">$6 with a morning drink.</p></div><button class="btn btn-ink" type="button" id="cart-upsell">Add · $6</button></div>`;
  }

  function openCart() {
    state.lastFocus = document.activeElement;
    $("#cart-drawer").hidden = false;
    $("#backdrop").hidden = false;
    requestAnimationFrame(() => {
      $("#cart-drawer").classList.add("open");
      $("#backdrop").classList.add("show");
    });
    document.body.classList.add("locked");
    $("#app-root").inert = true;
    renderCart();
    $("#cart-close").focus();
  }

  function closeCart() {
    $("#cart-drawer").classList.remove("open");
    $("#backdrop").classList.remove("show");
    document.body.classList.remove("locked");
    $("#app-root").inert = false;
    setTimeout(() => {
      $("#cart-drawer").hidden = true;
      $("#backdrop").hidden = true;
    }, 220);
    if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
  }

  function toast(message) {
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = message;
    $("#toasts").appendChild(node);
    setTimeout(() => node.remove(), 2400);
  }

  function applyPreset(id) {
    const preset = PRESETS[id];
    state.studio = {
      preset: id,
      name: preset.name,
      base: preset.base,
      size: preset.size,
      tier: preset.tier,
      syrups: preset.syrups.slice(),
      milk: preset.milk,
      shot: preset.shot,
      foam: preset.foam,
      includedFoam: preset.includedFoam,
      drizzle: preset.drizzle,
      notes: preset.notes.slice(),
      image: preset.image
    };
    paintStudio();
  }

  function studioPrice() {
    const s = state.studio;
    let cents = LADDER[s.tier][s.size];
    if (s.shot) cents += 100;
    if (s.foam) cents += 100;
    return cents;
  }

  function paintStudio() {
    const s = state.studio;
    const base = STUDIO_BASES[s.base];
    const cup = $("#cup");
    cup.style.setProperty("--liquid", base.liquid);
    cup.style.setProperty("--deep", base.deep);
    cup.style.setProperty("--swirl", base.swirl);
    const alpha = s.milk === "None" ? "0" : s.milk === "Half & Half" ? "0.95" : s.milk === "Oat Milk" ? "0.72" : "0.62";
    cup.style.setProperty("--swirl-alpha", alpha);
    cup.classList.toggle("oz-16", s.size === "16");
    cup.classList.toggle("oz-24", s.size === "24");
    cup.classList.toggle("oz-32", s.size === "32");
    cup.classList.toggle("has-foam", s.foam || s.includedFoam);
    cup.classList.toggle("has-drizzle", s.drizzle);
    const notes = s.notes.concat(s.syrups.map((name) => ({ name, color: SYRUP_COLOR[name] || "#D48834" })));
    const seen = new Set();
    $("#cup-notes").innerHTML = notes.filter((note) => {
      if (seen.has(note.name)) return false;
      seen.add(note.name);
      return true;
    }).map((note) => `<li><i style="--note:${esc(note.color)}"></i>${esc(note.name)}</li>`).join("");
    $("#cup-title").textContent = `${s.name} · ${s.size} oz`;
    $("#cup-price").textContent = receipt(studioPrice());
    $("#cup-tier").textContent = s.tier === "signature" ? "Signature menu pricing" : "Build-your-own pricing · 16 oz $6.00 · 24 oz $7.50 · 32 oz $9.00";
    const ladder = LADDER[s.tier];
    $("#studio-sizes").innerHTML = ["16", "24", "32"].map((size) => {
      const on = s.size === size;
      return `<button type="button" data-studio="size" data-value="${size}" aria-pressed="${on}">${size} oz · ${receipt(ladder[size])}</button>`;
    }).join("");
    $$("[data-studio='base']").forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.value === s.base)));
    $$("#studio-syrups [data-value]").forEach((btn) => btn.setAttribute("aria-pressed", String(s.syrups.includes(btn.dataset.value))));
    $$("#studio-milks [data-value]").forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.value === s.milk)));
    $$(".preset").forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.preset === s.preset)));
    $("#studio-shot").checked = s.shot;
    $("#studio-foam").checked = s.foam;
    $("#studio-drizzle").checked = s.drizzle;
    $("#studio-add").textContent = `Add Custom Drink to Bag · ${receipt(studioPrice())}`;
    const active = document.activeElement;
    if (active && active.dataset && active.dataset.studio) {
      const next = document.querySelector(`[data-studio="${active.dataset.studio}"][aria-pressed="true"]`);
      if (next) next.focus();
    }
  }

  function buildStudioControls() {
    $("#studio-bases").innerHTML = Object.entries(STUDIO_BASES).map(([id, base]) =>
      `<button type="button" data-studio="base" data-value="${id}" aria-pressed="false">${esc(base.name)}</button>`).join("");
    $("#studio-syrups").innerHTML = SYRUPS.map((syrup) =>
      `<button type="button" data-studio="syrup" data-value="${esc(syrup)}" aria-pressed="false">${esc(syrup)}</button>`).join("");
    $("#studio-milks").innerHTML = MILKS.map((milk) =>
      `<button type="button" data-studio="milk" data-value="${esc(milk)}" aria-pressed="false">${esc(milk)}</button>`).join("");
  }

  function clearPresetIdentity() {
    state.studio.preset = "";
    state.studio.name = STUDIO_BASES[state.studio.base].name;
    state.studio.tier = "standard";
    state.studio.includedFoam = false;
    state.studio.notes = [];
    state.studio.image = state.studio.base === "latte" || state.studio.base === "coldbrew"
      ? "./images/coffee-drinks.jpg"
      : "./images/lotus-drinks.jpg";
  }

  function addStudioToCart() {
    const s = state.studio;
    const parts = [
      `${s.size} oz`,
      STUDIO_BASES[s.base].name,
      s.milk !== "None" ? s.milk : null,
      s.syrups.length ? s.syrups.join(", ") : null,
      s.shot ? "Extra shot" : null,
      (s.foam || s.includedFoam) ? (s.includedFoam && !s.foam ? "Cold foam included" : "Cold foam") : null,
      s.drizzle ? "Caramel drizzle" : null
    ].filter(Boolean);
    s.notes.forEach((note) => {
      if (!parts.includes(note.name)) parts.push(note.name);
    });
    addLine({
      itemId: s.preset ? PRESET_ITEM[s.preset] : `studio-${s.base}`,
      name: s.name,
      image: s.image,
      alt: s.name,
      qty: 1,
      unit: studioPrice(),
      parts,
      kind: "drink"
    });
  }

  const PRESET_ITEM = {
    foxy: "feeling-foxy",
    wicked: "wicked-den",
    summer: "summertime",
    banana: "shaken-banana",
    mistletoe: "mistletoe"
  };

  function setBusy(minutes) {
    state.busy = minutes;
    $$("[data-busy]").forEach((btn) => btn.setAttribute("aria-pressed", String(Number(btn.dataset.busy) === minutes)));
    $$("[data-eta]").forEach((node) => { node.textContent = etaText(); });
  }

  function updateControlCopy() {
    const roll = state.eightysix ? "Jumbo Caramel Rolls are 86’d on the menu." : "Caramel rolls are for sale.";
    const sips = state.seasonalLive ? "Christmas sips are on the menu." : "Christmas sips are held.";
    $("#control-status").textContent = `${roll} ${sips}`;
    $("#toggle-86").setAttribute("aria-pressed", String(state.eightysix));
    $("#toggle-86").textContent = state.eightysix ? "Caramel rolls are 86’d" : "86 Jumbo Caramel Rolls";
    $("#toggle-seasonal").setAttribute("aria-pressed", String(state.seasonalLive));
    $("#toggle-seasonal").textContent = state.seasonalLive ? "Christmas sips are live" : "Christmas sips are held";
  }

  function renderRevenue() {
    const orders = Number($("#rev-orders").value);
    const addon = Number($("#rev-addon").value);
    const month = Math.round(orders * addon * 30);
    $("#rev-orders-out").textContent = String(orders);
    $("#rev-addon-out").textContent = addon % 1 ? `$${addon.toFixed(2)}` : `$${addon.toFixed(2)}`;
    $("#rev-month").textContent = month.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
    $("#rev-year").textContent = `About ${(month * 12).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} across twelve months like that.`;
  }

  function setDomain(host) {
    $$(".domain-pill").forEach((btn) => {
      const on = btn.dataset.domain === host;
      btn.setAttribute("aria-checked", String(on));
      btn.setAttribute("aria-pressed", String(on));
    });
    $("#domain-url").textContent = `https://${host}`;
    $("#domain-title").textContent = host;
    $("#domain-sticker").textContent = host;
    $("#domain-blurb").innerHTML = `<strong>${esc(host)}</strong> — $0.01 first year with a 3-year term, then $22.99/yr. Verified available on GoDaddy Nov 19, 2026.`;
    $("#domain-check").href = `https://www.godaddy.com/domainsearch/find?domainToCheck=${encodeURIComponent(host)}`;
    $("#domain-check").textContent = `Check ${host} on GoDaddy ↗`;
  }

  function paintStatus(date = new Date()) {
    const status = statusFor(date);
    const badge = $("#status-badge");
    badge.classList.toggle("is-open", status.open);
    badge.classList.toggle("is-closed", !status.open);
    $("#status-text").textContent = status.headline;
    $("#status-clock").textContent = status.clock;
    $$("[data-day]").forEach((row) => row.classList.toggle("is-today", row.dataset.day === status.now.weekday));
    return status;
  }

  function placeOrder() {
    if (!state.cart.length) return;
    if (state.fulfillment === "later" && !state.slot) {
      toast("Choose a pickup time during today’s open hours.");
      return;
    }
    const status = statusFor(new Date());
    const number = `#RF-${100 + Math.floor(Math.random() * 900)}`;
    const when = state.fulfillment === "asap"
      ? `ASAP PICKUP · ${etaText()}`
      : `SCHEDULED ${formatClock(Math.floor(Number(state.slot) / 60), Number(state.slot) % 60)}`;
    const names = state.cart.map((line) => {
      const extra = line.parts.slice(0, 3).join(" ");
      return extra ? `${line.qty}× ${line.name} (${extra})` : `${line.qty}× ${line.name}`;
    }).join(", ");
    $("#order-summary").textContent = `${number} · ${when} · ${names}`;
    const closed = status.open ? "" : ` Kitchen status right now: ${status.headline}.`;
    $("#order-banner").textContent = `Demo only — no card charged, no ticket sent to the kitchen.${closed}`;
    renderTicket(number, when, status);
    $("#tab-guest").setAttribute("aria-selected", "true");
    $("#tab-kitchen").setAttribute("aria-selected", "false");
    $("#panel-guest").hidden = false;
    $("#panel-kitchen").hidden = true;
    $("#order-dialog").showModal();
    startTimeline(number);
  }

  function renderTicket(number, when, status) {
    const sub = cartSubtotal();
    const tax = Math.round(sub * TAX_RATE);
    const lines = state.cart.map((line) => {
      const mods = line.parts.length ? `<br>${esc(line.parts.join(" · "))}` : "";
      return `<div><strong>${line.qty}  ${esc(line.name.toUpperCase())}</strong>${mods}</div>`;
    }).join("<hr>");
    $("#ticket").innerHTML = `
      <h3>THE RED FOX</h3>
      <p class="center">1317 BORDER LANE<br>WASHBURN, ND</p>
      <hr>
      <p class="center"><strong>${esc(number)} · ${esc(when)}</strong><br>${esc(status.clock)}</p>
      <hr>
      ${lines}
      <hr>
      <div class="row"><span>SUBTOTAL</span><span>${receipt(sub)}</span></div>
      <div class="row"><span>TAX EST 5%</span><span>${receipt(tax)}</span></div>
      <div class="row"><span>TOTAL</span><span>${receipt(sub + tax)}</span></div>
      <hr>
      <p class="center">*** DEMO — NO CHARGE ***</p>`;
  }

  function startTimeline(number) {
    clearInterval(state.orderTimer);
    const steps = $$("#timeline li");
    steps.forEach((step) => step.classList.remove("is-done", "is-now"));
    $("#sms-1").textContent = `The Red Fox: We got ${number}. ${state.fulfillment === "asap" ? etaText() : "Scheduled pickup"} at 1317 Border Lane.`;
    $("#sms-2").hidden = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let index = 0;
    const tick = () => {
      steps.forEach((step, i) => {
        step.classList.toggle("is-done", i <= index);
        step.classList.toggle("is-now", i === index);
      });
      if (index >= steps.length - 1) {
        $("#sms-2").hidden = false;
        $("#sms-2").textContent = `The Red Fox: ${number} is ready at the counter. 1317 Border Lane, Washburn.`;
        clearInterval(state.orderTimer);
      }
      index += 1;
    };
    if (reduce) {
      index = steps.length - 1;
      tick();
      return;
    }
    tick();
    state.orderTimer = setInterval(tick, 900);
  }

  function bind() {
    $("#menu-tabs").addEventListener("click", (event) => {
      const btn = event.target.closest("[data-tab]");
      if (!btn) return;
      state.tab = btn.dataset.tab;
      state.sub = "all";
      $$("#menu-tabs [data-tab]").forEach((tab) => tab.setAttribute("aria-selected", String(tab === btn)));
      renderSubs();
      renderMenu();
    });

    $("#menu-subs").addEventListener("click", (event) => {
      const btn = event.target.closest("[data-sub]");
      if (!btn) return;
      state.sub = btn.dataset.sub;
      renderSubs();
      renderMenu();
    });

    $(".chips").addEventListener("click", (event) => {
      const btn = event.target.closest("[data-chip]");
      if (!btn) return;
      state.chip = btn.dataset.chip;
      $$(".chip").forEach((chip) => chip.setAttribute("aria-pressed", String(chip === btn)));
      renderMenu();
    });

    $("#menu-search").addEventListener("input", (event) => {
      state.query = event.target.value;
      renderMenu();
    });

    $("#menu-grid").addEventListener("click", (event) => {
      const searchAll = event.target.closest("#search-all");
      if (searchAll) {
        state.tab = "full";
        state.sub = "all";
        $$("#menu-tabs [data-tab]").forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.tab === "full")));
        renderSubs();
        renderMenu();
        return;
      }
      const add = event.target.closest("[data-add]");
      if (add) {
        quickAdd(add.dataset.add);
        return;
      }
      const open = event.target.closest("[data-open]");
      if (open) openModal(open.dataset.open);
    });

    $("#modal-options").addEventListener("click", (event) => {
      const btn = event.target.closest("[data-choice]");
      if (!btn || !state.draft) return;
      const group = btn.dataset.group;
      const value = btn.dataset.value;
      if (group === "syrup") {
        const list = state.draft.mods.syrups;
        const index = list.indexOf(value);
        if (index >= 0) list.splice(index, 1);
        else list.push(value);
      } else if (group === "size") {
        const size = state.draft.item.sizes.find((row) => row.id === value);
        state.draft.mods.sizeId = size.id;
        state.draft.mods.size = size.label;
      } else {
        state.draft.mods[group] = value;
      }
      $$("#modal-options [data-choice]").forEach((choice) => {
        if (choice.dataset.group !== group) return;
        const on = group === "syrup"
          ? state.draft.mods.syrups.includes(choice.dataset.value)
          : choice.dataset.value === (group === "size" ? state.draft.mods.sizeId : state.draft.mods[group]);
        choice.setAttribute("aria-pressed", String(on));
      });
      syncTempLock();
      updateModalPrice();
    });

    $("#modal-options").addEventListener("change", (event) => {
      const input = event.target.closest("[data-flag]");
      if (!input || !state.draft) return;
      state.draft.mods[input.dataset.flag] = input.checked;
      updateModalPrice();
    });

    $("#modal-notes").addEventListener("input", (event) => {
      if (state.draft) state.draft.mods.notes = event.target.value.trim();
    });

    $("#modal-inc").addEventListener("click", () => {
      if (!state.draft) return;
      state.draft.qty = Math.min(20, state.draft.qty + 1);
      updateModalPrice();
    });
    $("#modal-dec").addEventListener("click", () => {
      if (!state.draft) return;
      state.draft.qty = Math.max(1, state.draft.qty - 1);
      updateModalPrice();
    });
    $("#modal-add").addEventListener("click", () => {
      if (!state.draft || holdState(state.draft.item)) return;
      const item = state.draft.item;
      const mods = state.draft.mods;
      mods.notes = $("#modal-notes").value.trim();
      addLine({
        itemId: item.id,
        name: item.name,
        image: item.image,
        alt: item.alt,
        qty: state.draft.qty,
        unit: priceCents(item, mods),
        parts: summarize(mods),
        kind: item.group === "breakfast" || item.group === "lunch" ? "food" : "drink"
      });
      $("#item-dialog").close();
    });
    $("#modal-close").addEventListener("click", () => $("#item-dialog").close());
    $("#item-dialog").addEventListener("click", (event) => {
      if (event.target === $("#item-dialog")) $("#item-dialog").close();
    });
    $("#item-dialog").addEventListener("close", () => {
      if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
    });

    buildStudioControls();
    applyPreset("foxy");
    $("#studio-form").addEventListener("click", (event) => {
      const btn = event.target.closest("[data-preset], [data-studio]");
      if (!btn) return;
      event.preventDefault();
      if (btn.dataset.preset) {
        applyPreset(btn.dataset.preset);
        return;
      }
      const kind = btn.dataset.studio;
      const value = btn.dataset.value;
      if (kind === "base") {
        state.studio.base = value;
        clearPresetIdentity();
      } else if (kind === "size") {
        state.studio.size = value;
      } else if (kind === "milk") {
        state.studio.milk = value;
        state.studio.preset = "";
      } else if (kind === "syrup") {
        const list = state.studio.syrups;
        const index = list.indexOf(value);
        if (index >= 0) list.splice(index, 1);
        else list.push(value);
        state.studio.preset = "";
      }
      paintStudio();
    });
    $("#studio-shot").addEventListener("change", (event) => { state.studio.shot = event.target.checked; paintStudio(); });
    $("#studio-foam").addEventListener("change", (event) => { state.studio.foam = event.target.checked; paintStudio(); });
    $("#studio-drizzle").addEventListener("change", (event) => { state.studio.drizzle = event.target.checked; paintStudio(); });
    $("#studio-form").addEventListener("submit", (event) => {
      event.preventDefault();
      addStudioToCart();
    });

    $("#header-cart").addEventListener("click", openCart);
    $("#cart-fab").addEventListener("click", openCart);
    $("#cart-close").addEventListener("click", closeCart);
    $("#backdrop").addEventListener("click", closeCart);

    $("#cart-drawer").addEventListener("click", (event) => {
      if (event.target.closest("#bag-to-menu")) {
        closeCart();
        return;
      }
      const inc = event.target.closest("[data-inc]");
      const dec = event.target.closest("[data-dec]");
      const remove = event.target.closest("[data-remove]");
      if (inc || dec || remove) {
        const uid = (inc || dec || remove).dataset.inc || (inc || dec || remove).dataset.dec || (inc || dec || remove).dataset.remove;
        const line = state.cart.find((row) => row.uid === uid);
        if (!line) return;
        if (remove) state.cart = state.cart.filter((row) => row.uid !== uid);
        if (inc) line.qty = Math.min(20, line.qty + 1);
        if (dec) {
          line.qty -= 1;
          if (line.qty <= 0) state.cart = state.cart.filter((row) => row.uid !== uid);
        }
        updateCartChrome();
        return;
      }
      const fulfill = event.target.closest("[data-fulfill]");
      if (fulfill) {
        state.fulfillment = fulfill.dataset.fulfill;
        renderCart();
        return;
      }
      if (event.target.id === "cart-upsell") quickAdd("caramel-roll");
      if (event.target.id === "place-order") placeOrder();
    });
    $("#cart-drawer").addEventListener("change", (event) => {
      if (event.target.id === "slot-select") state.slot = event.target.value;
    });

    document.addEventListener("click", (event) => {
      const busy = event.target.closest("[data-busy]");
      if (busy) setBusy(Number(busy.dataset.busy));
      const feature = event.target.closest("[data-feature]");
      if (feature) {
        $$("[data-feature]").forEach((btn) => btn.setAttribute("aria-selected", String(btn === feature)));
        $$("[data-feature-panel]").forEach((panel) => panel.classList.toggle("is-on", panel.dataset.featurePanel === feature.dataset.feature));
      }
    });

    $("#upsell-caramel").addEventListener("click", () => quickAdd("caramel-roll"));
    $("#toggle-86").addEventListener("click", () => {
      state.eightysix = !state.eightysix;
      updateControlCopy();
      renderMenu();
    });
    $("#toggle-seasonal").addEventListener("click", () => {
      state.seasonalLive = !state.seasonalLive;
      updateControlCopy();
      renderMenu();
    });

    $("#rev-orders").addEventListener("input", renderRevenue);
    $("#rev-addon").addEventListener("input", renderRevenue);

    $$(".domain-pill").forEach((btn) => btn.addEventListener("click", () => setDomain(btn.dataset.domain)));

    $("#order-close").addEventListener("click", () => $("#order-dialog").close());
    $("#order-done").addEventListener("click", () => $("#order-dialog").close());
    $("#order-dialog").addEventListener("click", (event) => {
      if (event.target === $("#order-dialog")) $("#order-dialog").close();
    });
    $("#order-dialog").addEventListener("close", () => clearInterval(state.orderTimer));
    $("#tab-guest").addEventListener("click", () => {
      $("#tab-guest").setAttribute("aria-selected", "true");
      $("#tab-kitchen").setAttribute("aria-selected", "false");
      $("#panel-guest").hidden = false;
      $("#panel-kitchen").hidden = true;
    });
    $("#tab-kitchen").addEventListener("click", () => {
      $("#tab-kitchen").setAttribute("aria-selected", "false");
      $("#tab-guest").setAttribute("aria-selected", "false");
      $("#tab-kitchen").setAttribute("aria-selected", "true");
      $("#panel-guest").hidden = true;
      $("#panel-kitchen").hidden = false;
    });
    $("#replay-status").addEventListener("click", () => {
      const summary = $("#order-summary").textContent || "";
      const number = (summary.match(/#RF-\d+/) || ["#RF-408"])[0];
      startTimeline(number);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if ($("#item-dialog").open || $("#order-dialog").open) return;
      if (!$("#cart-drawer").hidden) closeCart();
    });

    $("#cart-drawer").addEventListener("keydown", (event) => trap($("#cart-drawer"), event));
  }

  function trap(container, event) {
    if (event.key !== "Tab" || container.hidden) return;
    const focusables = $$( "button, a, input, select, textarea", container).filter((el) => !el.disabled && !el.closest("[hidden]"));
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function init() {
    if (MENU.length !== 61) console.warn("Expected 61 menu items, found", MENU.length);
    renderCounts();
    renderSubs();
    renderMenu();
    paintStatus();
    setInterval(() => paintStatus(), 15000);
    renderRevenue();
    updateControlCopy();
    updateCartChrome();
    setDomain("redfoxwashburn.com");
    bind();
    window.REDFOX_APP = { statusFor, state, MENU, receipt };
  }

  init();
})();
