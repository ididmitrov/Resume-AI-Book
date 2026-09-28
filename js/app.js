(function () {
  const root = document.getElementById("app");

  const state = {
    query: "",
    topicId: topics[0].id,
    activeId: null,
    view: "lectures",
    workbookId: null,
    sheetStatus: "idle",
  };

  const sheetCache = {};

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function findLecture(id) {
    for (const topic of topics) {
      const lecture = topic.lectures.find((item) => item.id === id);
      if (lecture) return { topic, lecture };
    }
    return null;
  }

  function renderBlock(block) {
    if (block.type === "h2") return `<h2>${escapeHtml(block.text)}</h2>`;
    if (block.type === "p") return `<p>${escapeHtml(block.text)}</p>`;
    if (block.type === "list") {
      return `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
    }
    if (block.type === "callout") {
      return `<div class="callout"><strong>${escapeHtml(block.title)}</strong>${escapeHtml(block.text)}</div>`;
    }
    if (block.type === "example") {
      return `<div class="example"><strong>${escapeHtml(block.label)}</strong><pre>${escapeHtml(block.prompt)}</pre></div>`;
    }
    return "";
  }

  function renderHome(currentTopic, filtered) {
    const tabs = topics
      .map(
        (topic) => `
          <button
            class="${topic.id === currentTopic.id ? "tab is-active" : "tab"}"
            role="tab"
            aria-selected="${topic.id === currentTopic.id}"
            data-action="topic"
            data-id="${topic.id}"
          >
            <span class="tab-num">${pad(topic.number)}</span>
            <span class="tab-copy">
              <span class="tab-title">${escapeHtml(topic.title)}</span>
              <span class="tab-sub">${escapeHtml(topic.subtitle)}</span>
            </span>
          </button>
        `
      )
      .join("");

    const cards =
      filtered.length === 0
        ? `<p class="empty">Няма съвпадение в тази тема. Пробвай друга дума или смени таба.</p>`
        : `<section class="grid">${filtered
            .map(
              (lecture) => `
                <button class="card" data-action="lecture" data-id="${lecture.id}">
                  <div class="card-top">
                    <span class="num">${pad(lecture.number)}</span>
                  </div>
                  <div>
                    <h2>${escapeHtml(lecture.title)}</h2>
                    <h3>${escapeHtml(lecture.subtitle)}</h3>
                  </div>
                  <p>${escapeHtml(lecture.teaser)}</p>
                  <div class="tags">
                    ${lecture.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
                  </div>
                </button>
              `
            )
            .join("")}</section>`;

    return `
      <main class="wrap">
        <section class="hero">
          <h1>Лекциите, събрани като тетрадка.</h1>
          <p>${escapeHtml(course.tagline)}</p>
        </section>
        <div class="tabs" role="tablist" aria-label="Големи теми">${tabs}</div>
        <div class="topic-now">
          <p class="topic-now-kicker">Тема ${pad(currentTopic.number)}</p>
          <h2>${escapeHtml(currentTopic.title)}</h2>
          <p>${escapeHtml(currentTopic.subtitle)}</p>
        </div>
        <div class="toolbar">
          <input
            class="search"
            data-action="search"
            value="${escapeHtml(state.query)}"
            placeholder="Търси подтема в избраната тема…"
            aria-label="Търсене в подтемите"
          />
          <div class="count">${filtered.length === 1 ? "1 подтема" : `${filtered.length} подтеми`}</div>
        </div>
        ${cards}
      </main>
    `;
  }

  function renderLecture(active) {
    return `
      <main class="wrap lecture">
        <button class="back" data-action="back" data-topic="${active.topic.id}">
          ← Към ${escapeHtml(active.topic.title)}
        </button>
        <article class="paper">
          <div class="paper-kicker">
            <span>Тема ${pad(active.topic.number)} · Подтема ${pad(active.lecture.number)}</span>
          </div>
          <h1>${escapeHtml(active.lecture.title)}</h1>
          <p class="lede">${escapeHtml(active.lecture.subtitle)}</p>
          ${active.lecture.content.map(renderBlock).join("")}
        </article>
      </main>
    `;
  }

  function renderHeader() {
    const modes = [
      ["lectures", "Лекции"],
      ["practice", "Практика"],
    ]
      .map(
        ([id, label]) => `
          <button
            class="mode${state.view === id ? " is-active" : ""}"
            data-action="mode"
            data-mode="${id}"
            aria-pressed="${state.view === id}"
          >${label}</button>`
      )
      .join("");

    return `
      <header class="wrap topbar">
        <button class="brand" data-action="home">
          <span class="brand-kicker">${escapeHtml(course.subtitle)}</span>
          <span class="brand-name">${escapeHtml(course.title)}</span>
        </button>
        <nav class="modes" aria-label="Раздели">${modes}</nav>
        <div class="topbar-meta">${escapeHtml(course.instructor)}</div>
      </header>`;
  }

  function renderPracticeHome(filtered) {
    const cards =
      filtered.length === 0
        ? `<p class="empty">Няма такова упражнение. Пробвай друга дума.</p>`
        : `<section class="grid">${filtered
            .map(
              (book) => `
                <button class="card" data-action="workbook" data-id="${book.id}">
                  <div class="card-top">
                    <span class="num${book.code.length > 2 ? " num-word" : ""}">${escapeHtml(book.code)}</span>
                    <span class="tag">Попълнено</span>
                  </div>
                  <div>
                    <h2>${escapeHtml(book.title)}</h2>
                    <h3>${escapeHtml(book.subtitle)}</h3>
                  </div>
                  <p>${escapeHtml(book.teaser)}</p>
                  <div class="tags"><span class="tag">${escapeHtml(book.tag)}</span></div>
                </button>`
            )
            .join("")}</section>`;

    const count =
      filtered.length === 1 ? "1 лист" : `${filtered.length} листа`;

    return `
      <main class="wrap">
        <section class="hero">
          <h1>${escapeHtml(practiceIntro.title)}</h1>
          <p>${escapeHtml(practiceIntro.tagline)}</p>
        </section>
        <div class="toolbar">
          <input
            class="search"
            data-action="search"
            value="${escapeHtml(state.query)}"
            placeholder="Търси упражнение…"
            aria-label="Търсене в упражненията"
          />
          <div class="count">${count}</div>
        </div>
        ${cards}
      </main>`;
  }

  function renderSheet() {
    const book = workbooks.find((item) => item.id === state.workbookId);
    const cached = sheetCache[state.workbookId];
    const kicker = book.tag === "изпит" ? "Подготовка за изпит" : "Попълнено упражнение";
    let body = `<p class="lede">${
      state.sheetStatus === "error"
        ? "Листът не се зареди. Презареди страницата и опитай пак."
        : "Зарежда се попълненият лист…"
    }</p>`;

    if (cached) {
      const toc = cached.toc
        .map(
          (item) =>
            `<button class="toc-link toc-l${item.level}" data-action="jump" data-id="${item.id}">${escapeHtml(item.text)}</button>`
        )
        .join("");
      body = `
        <div class="sheet-layout">
          <nav class="toc" aria-label="Съдържание на листа">${toc}</nav>
          <article class="paper sheet">${cached.html}</article>
        </div>`;
    }

    return `
      <main class="wrap lecture">
        <button class="back" data-action="practice-home">← Към упражненията</button>
        <p class="sheet-kicker">${escapeHtml(book.code)} · ${escapeHtml(kicker)}</p>
        ${body}
      </main>`;
  }

  function openWorkbook(id) {
    state.view = "practice";
    state.workbookId = id;
    state.activeId = null;
    window.scrollTo(0, 0);
    const text = sheets[id];
    if (!text) {
      state.sheetStatus = "error";
      render();
      return;
    }
    if (!sheetCache[id]) sheetCache[id] = renderMarkdown(text);
    state.sheetStatus = "ready";
    render();
  }

  function render() {
    const searchEl = root.querySelector(".search");
    const hadSearchFocus = document.activeElement === searchEl;
    const selectionStart = hadSearchFocus ? searchEl.selectionStart : null;
    const selectionEnd = hadSearchFocus ? searchEl.selectionEnd : null;

    const active = state.view === "lectures" && state.activeId ? findLecture(state.activeId) : null;
    const q = state.query.trim().toLowerCase();
    let main = "";

    if (state.view === "practice") {
      if (state.workbookId) {
        main = renderSheet();
      } else {
        const filtered = !q
          ? workbooks
          : workbooks.filter((book) =>
              [book.title, book.subtitle, book.teaser, book.tag, book.code].join(" ").toLowerCase().includes(q)
            );
        main = renderPracticeHome(filtered);
      }
    } else {
      const currentTopic = topics.find((topic) => topic.id === state.topicId) ?? topics[0];
      const filtered = !q
        ? currentTopic.lectures
        : currentTopic.lectures.filter((lecture) => {
            const hay = [lecture.title, lecture.subtitle, lecture.teaser, ...(lecture.tags || [])]
              .join(" ")
              .toLowerCase();
            return hay.includes(q);
          });
      main = active ? renderLecture(active) : renderHome(currentTopic, filtered);
    }

    root.innerHTML = `${renderHeader()}${main}`;

    if (hadSearchFocus) {
      const nextSearch = root.querySelector(".search");
      if (nextSearch) {
        nextSearch.focus();
        nextSearch.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  }

  root.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target || !root.contains(target)) return;

    const action = target.dataset.action;
    if (action === "home") {
      state.activeId = null;
      state.workbookId = null;
      state.query = "";
      window.scrollTo(0, 0);
      render();
    } else if (action === "mode") {
      state.view = target.dataset.mode;
      state.activeId = null;
      state.workbookId = null;
      state.query = "";
      window.scrollTo(0, 0);
      render();
    } else if (action === "topic") {
      state.topicId = target.dataset.id;
      state.query = "";
      state.activeId = null;
      render();
    } else if (action === "lecture") {
      state.activeId = target.dataset.id;
      window.scrollTo(0, 0);
      render();
    } else if (action === "back") {
      state.topicId = target.dataset.topic;
      state.activeId = null;
      window.scrollTo(0, 0);
      render();
    } else if (action === "workbook") {
      openWorkbook(target.dataset.id);
    } else if (action === "practice-home") {
      state.workbookId = null;
      state.query = "";
      window.scrollTo(0, 0);
      render();
    } else if (action === "jump") {
      const destination = document.getElementById(target.dataset.id);
      if (destination) destination.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  root.addEventListener("input", (event) => {
    if (event.target.matches("[data-action='search']")) {
      state.query = event.target.value;
      render();
    }
  });

  render();
})();
