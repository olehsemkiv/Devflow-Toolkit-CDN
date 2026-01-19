// src/modules/accordion.js
(function () {
  if (!window.RS || !window.RS.register) {
    console.warn("[RS] core is missing. Include rs-core.min.js first.");
    return;
  }

  const SEL = {
    item: "[data-rs-accordion-item]",
    head: "[data-rs-accordion-head]",
    panel: "[data-rs-accordion-panel]",
  };

  function getOffset(item) {
    const raw =
      item.getAttribute("data-rs-accordion-offset") ||
      item.closest("[data-rs-accordion-offset]")?.getAttribute("data-rs-accordion-offset") ||
      "0";

    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  }

  function setPanelHeight(item) {
    const panel = item.querySelector(SEL.panel);
    if (!panel) return;

    const offset = getOffset(item);
    panel.style.maxHeight = (panel.scrollHeight + offset) + "px";
  }

  function closeItem(item) {
    const head = item.querySelector(SEL.head);
    const panel = item.querySelector(SEL.panel);
    if (!panel) return;

    item.classList.remove("is-open");
    head?.classList.remove("is-open");
    panel.classList.remove("is-open");

    // Animate to 0
    panel.style.maxHeight = "0px";

    window.RS.emit?.("rs:accordion:close", { item });
  }

  function openItem(item) {
    const head = item.querySelector(SEL.head);
    const panel = item.querySelector(SEL.panel);
    if (!panel) return;

    item.classList.add("is-open");
    head?.classList.add("is-open");
    panel.classList.add("is-open");

    setPanelHeight(item);

    window.RS.emit?.("rs:accordion:open", { item });
  }

  function toggleItem(item) {
    if (item.classList.contains("is-open")) {
      closeItem(item);
    } else {
      // group logic: якщо є group — закриваємо інші open в цій групі
      const group = item.getAttribute("data-rs-accordion-group");
      if (group) {
        document
          .querySelectorAll(`${SEL.item}[data-rs-accordion-group="${CSS.escape(group)}"].is-open`)
          .forEach((el) => {
            if (el !== item) closeItem(el);
          });
      }

      openItem(item);
    }
  }

  function initDefaults() {
    document.querySelectorAll(SEL.item).forEach((item) => {
      const openAttr = item.getAttribute("data-rs-accordion-open");
      const shouldOpen = item.classList.contains("is-open") || openAttr === "true";

      const panel = item.querySelector(SEL.panel);
      if (!panel) return;

      if (shouldOpen) {
        // ensure state + height
        item.classList.add("is-open");
        item.querySelector(SEL.head)?.classList.add("is-open");
        panel.classList.add("is-open");
        setPanelHeight(item);
      } else {
        panel.style.maxHeight = "0px";
      }
    });
  }

  function bindEvents() {
    // click
    document.addEventListener("click", (e) => {
      const head = e.target.closest(SEL.head);
      if (!head) return;

      const item = head.closest(SEL.item);
      if (!item) return;

      toggleItem(item);
    });

    // optional keyboard (якщо head = div). Не ламає кнопки.
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;

      const head = e.target.closest?.(SEL.head);
      if (!head) return;

      // prevent page scroll on Space
      e.preventDefault();

      const item = head.closest(SEL.item);
      if (!item) return;

      toggleItem(item);
    });

    // resize: перерахувати висоту для відкритих
    window.addEventListener("resize", () => {
      document.querySelectorAll(`${SEL.item}.is-open`).forEach(setPanelHeight);
    });
  }

  window.RS.register("accordion", function initAccordion() {
    initDefaults();
    bindEvents();
    window.RS.debug?.("accordion ready");
  });
})();
