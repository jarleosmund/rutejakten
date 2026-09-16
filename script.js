(function () {
  const START_LENGTH = 2;
  const FLASH_MS = 650;
  const GAP_MS = 280;
  const PAUSE_BEFORE_MS = 700;
  const PAUSE_AFTER_MS = 450;
  const LANG_KEY = "rutejakten-lang";
  const THEME_KEY = "rutejakten-theme";

  const I18N = {
    no: {
      title: "Rutejakten",
      heading: "Rutejakten",
      intro:
        "Et rutenett viser en kort sekvens av ruter som lyser opp, én om gangen. Trykk rutene i samme rekkefølge. Klarer du det, får du poeng og sekvensen blir én rute lengre. Trykker du feil, vises den riktige sekvensen, og du prøver samme nivå igjen. Ingen tidsfrist. Du kan også spille med tallene 1–9 på tastaturet, med samme plassering som på numerisk tastatur.",
      level: "Nivå",
      score: "Poeng",
      restart: "Start på nytt",
      idle: "Trykk «Start på nytt» for å begynne.",
      watch: "Se på sekvensen.",
      yourTurn: "Din tur. Trykk rutene i samme rekkefølge.",
      correct: "Riktig!",
      correctNext: "Riktig! Se den nye, lengre sekvensen.",
      wrong: "Feil. Her er den riktige sekvensen. Prøv samme nivå igjen.",
      statusAria: "Spillstatus",
      boardAria: "Rutenett",
      tile: "Rute",
      light: "Lys",
      dark: "Mørk",
      langGroup: "Språk",
      themeGroup: "Utseende",
      prefsAria: "Språk og utseende",
    },
    en: {
      title: "Grid Hunt",
      heading: "Grid Hunt",
      intro:
        "A grid shows a short sequence of tiles lighting up, one at a time. Press the tiles in the same order. If you get it right, you score a point and the sequence grows by one tile. If you press the wrong tile, the correct sequence is shown and you try the same level again. No time limit. You can also play with the number keys 1–9, using the same layout as a numeric keypad.",
      level: "Level",
      score: "Score",
      restart: "Restart",
      idle: "Press “Restart” to begin.",
      watch: "Watch the sequence.",
      yourTurn: "Your turn. Press the tiles in the same order.",
      correct: "Correct!",
      correctNext: "Correct! Watch the new, longer sequence.",
      wrong: "Wrong. Here is the correct sequence. Try the same level again.",
      statusAria: "Game status",
      boardAria: "Grid",
      tile: "Tile",
      light: "Light",
      dark: "Dark",
      langGroup: "Language",
      themeGroup: "Appearance",
      prefsAria: "Language and appearance",
    },
  };

  const cells = Array.from(document.querySelectorAll(".cell"));
  const levelEl = document.getElementById("level");
  const scoreEl = document.getElementById("score");
  const messageEl = document.getElementById("message");
  const restartBtn = document.getElementById("restart");
  const langNoBtn = document.getElementById("lang-no");
  const langEnBtn = document.getElementById("lang-en");
  const themeLightBtn = document.getElementById("theme-light");
  const themeDarkBtn = document.getElementById("theme-dark");

  let lang = "no";
  let theme = "dark";
  let messageKey = "idle";
  let messageKind = "";
  let sequence = [];
  let playerStep = 0;
  let score = 0;
  let acceptingInput = false;
  let roundToken = 0;

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function readStore(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value == null ? fallback : value;
    } catch (e) {
      return fallback;
    }
  }

  function writeStore(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }

  function t(key) {
    return I18N[lang][key];
  }

  function setPressed(button, pressed) {
    button.setAttribute("aria-pressed", pressed ? "true" : "false");
  }

  function applyLanguage(next) {
    lang = next === "en" ? "en" : "no";
    writeStore(LANG_KEY, lang);
    document.documentElement.lang = lang === "en" ? "en" : "no";
    document.title = t("title");

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
    cells.forEach(function (cell) {
      cell.setAttribute("aria-label", t("tile") + " " + cell.textContent.trim());
    });

    setPressed(langNoBtn, lang === "no");
    setPressed(langEnBtn, lang === "en");
    setMessage(messageKey, messageKind);
  }

  function applyTheme(next) {
    theme = next === "dark" ? "dark" : "light";
    writeStore(THEME_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
    setPressed(themeLightBtn, theme === "light");
    setPressed(themeDarkBtn, theme === "dark");
  }

  function setMessage(key, kind) {
    messageKey = key;
    messageKind = kind || "";
    messageEl.textContent = t(key);
    messageEl.classList.remove("is-good", "is-warn");
    if (messageKind) {
      messageEl.classList.add(messageKind);
    }
  }

  function updateStats() {
    levelEl.textContent = String(sequence.length || START_LENGTH);
    scoreEl.textContent = String(score);
  }

  function setCellsEnabled(enabled) {
    cells.forEach(function (cell) {
      cell.disabled = !enabled;
    });
  }

  function clearCellStates() {
    cells.forEach(function (cell) {
      cell.classList.remove("is-lit", "is-press");
    });
  }

  function randomCell() {
    return Math.floor(Math.random() * cells.length);
  }

  function growSequence() {
    sequence.push(randomCell());
  }

  function startGame() {
    roundToken += 1;
    sequence = [];
    playerStep = 0;
    score = 0;
    acceptingInput = false;
    for (let i = 0; i < START_LENGTH; i += 1) {
      growSequence();
    }
    updateStats();
    playSequence("watch");
  }

  async function flashCell(index, className, duration) {
    const cell = cells[index];
    cell.classList.add(className);
    await delay(duration);
    cell.classList.remove(className);
  }

  async function playSequence(key, kind) {
    const token = roundToken;
    acceptingInput = false;
    playerStep = 0;
    setCellsEnabled(false);
    clearCellStates();
    setMessage(key || "watch", kind);
    updateStats();

    await delay(PAUSE_BEFORE_MS);
    if (token !== roundToken) {
      return;
    }

    for (let i = 0; i < sequence.length; i += 1) {
      await flashCell(sequence[i], "is-lit", FLASH_MS);
      if (token !== roundToken) {
        return;
      }
      await delay(GAP_MS);
      if (token !== roundToken) {
        return;
      }
    }

    await delay(PAUSE_AFTER_MS);
    if (token !== roundToken) {
      return;
    }

    setCellsEnabled(true);
    acceptingInput = true;
    setMessage("yourTurn");
  }

  function onCorrectRound() {
    score += 1;
    growSequence();
    updateStats();
    playSequence("correctNext");
  }

  function onWrongPress() {
    playSequence("wrong", "is-warn");
  }

  async function handlePress(index) {
    if (!acceptingInput) {
      return;
    }

    const token = roundToken;
    flashCell(index, "is-press", 180);

    if (index !== sequence[playerStep]) {
      acceptingInput = false;
      setCellsEnabled(false);
      onWrongPress();
      return;
    }

    playerStep += 1;
    if (playerStep === sequence.length) {
      acceptingInput = false;
      setCellsEnabled(false);
      setMessage("correct", "is-good");
      await delay(500);
      if (token !== roundToken) {
        return;
      }
      onCorrectRound();
    }
  }

  const DIGIT_TO_INDEX = {
    7: 0,
    8: 1,
    9: 2,
    4: 3,
    5: 4,
    6: 5,
    1: 6,
    2: 7,
    3: 8,
  };

  const NUMPAD_CODE_TO_INDEX = {
    Numpad7: 0,
    Numpad8: 1,
    Numpad9: 2,
    Numpad4: 3,
    Numpad5: 4,
    Numpad6: 5,
    Numpad1: 6,
    Numpad2: 7,
    Numpad3: 8,
  };

  function indexFromKey(event) {
    if (Object.prototype.hasOwnProperty.call(NUMPAD_CODE_TO_INDEX, event.code)) {
      return NUMPAD_CODE_TO_INDEX[event.code];
    }
    if (Object.prototype.hasOwnProperty.call(DIGIT_TO_INDEX, event.key)) {
      return DIGIT_TO_INDEX[event.key];
    }
    return null;
  }

  cells.forEach(function (cell) {
    cell.addEventListener("click", function () {
      handlePress(Number(cell.dataset.index));
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }
    const index = indexFromKey(event);
    if (index === null) {
      return;
    }
    event.preventDefault();
    handlePress(index);
  });

  restartBtn.addEventListener("click", startGame);
  langNoBtn.addEventListener("click", function () {
    applyLanguage("no");
  });
  langEnBtn.addEventListener("click", function () {
    applyLanguage("en");
  });
  themeLightBtn.addEventListener("click", function () {
    applyTheme("light");
  });
  themeDarkBtn.addEventListener("click", function () {
    applyTheme("dark");
  });

  applyTheme(readStore(THEME_KEY, "dark"));
  applyLanguage(readStore(LANG_KEY, "no"));
  setCellsEnabled(false);
  updateStats();
})();
