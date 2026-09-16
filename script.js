(function () {
  const START_LENGTH = 2;
  const FLASH_MS = 650;
  const GAP_MS = 280;
  const PAUSE_BEFORE_MS = 700;
  const PAUSE_AFTER_MS = 450;
  const LANG_KEY = "rutejakten-lang";
  const THEME_KEY = "rutejakten-theme";
  const SOUND_KEY = "rutejakten-sound";
  const CELL_FREQS = [
    440.0, 523.25, 587.33, 293.66, 329.63, 392.0, 196.0, 220.0, 261.63,
  ];

  const I18N = {
    no: {
      title: "Rutejakten",
      heading: "Rutejakten",
      intro:
        "Et rutenett viser en kort sekvens av ruter som lyser opp, én om gangen. Trykk rutene i samme rekkefølge. Klarer du det, får du poeng og sekvensen blir én rute lengre. Trykker du feil, vises den riktige sekvensen, og du prøver samme nivå igjen. Ingen tidsfrist. Du kan også spille med tallene 1–9 på tastaturet (samme plassering som på numerisk tastatur) eller med QWE/ASD/ZXC.",
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
      soundGroup: "Lyd",
      soundOn: "Lyd på",
      soundOff: "Lyd av",
      prefsAria: "Språk og utseende",
      settings: "Innstillinger",
    },
    en: {
      title: "Grid Hunt",
      heading: "Grid Hunt",
      intro:
        "A grid shows a short sequence of tiles lighting up, one at a time. Press the tiles in the same order. If you get it right, you score a point and the sequence grows by one tile. If you press the wrong tile, the correct sequence is shown and you try the same level again. No time limit. You can also play with the number keys 1–9 (same layout as a numeric keypad) or with QWE/ASD/ZXC.",
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
      soundGroup: "Sound",
      soundOn: "Sound on",
      soundOff: "Sound off",
      prefsAria: "Language and appearance",
      settings: "Settings",
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
  const soundToggleBtn = document.getElementById("sound-toggle");
  const settingsToggleBtn = document.getElementById("settings-toggle");
  const settingsPanel = document.getElementById("settings-panel");

  let lang = "no";
  let theme = "dark";
  let soundOn = true;
  let audioCtx = null;
  let masterGain = null;
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
    updateSoundButton();
    setMessage(messageKey, messageKind);
  }

  function applyTheme(next) {
    theme = next === "dark" ? "dark" : "light";
    writeStore(THEME_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
    setPressed(themeLightBtn, theme === "light");
    setPressed(themeDarkBtn, theme === "dark");
  }

  function updateSoundButton() {
    var label = soundToggleBtn.querySelector(".pref-btn-label");
    if (label) {
      label.textContent = t(soundOn ? "soundOn" : "soundOff");
    }
    setPressed(soundToggleBtn, soundOn);
  }

  function applySound(next) {
    soundOn = next !== "off";
    writeStore(SOUND_KEY, soundOn ? "on" : "off");
    updateSoundButton();
    if (!soundOn && audioCtx && audioCtx.state === "running") {
      audioCtx.suspend();
    }
  }

  function ensureAudio() {
    if (!soundOn) {
      return;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      return;
    }
    if (!audioCtx) {
      audioCtx = new AC();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.65;
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }

  function playBell(freq, seconds, peak, delaySec) {
    if (!soundOn) {
      return;
    }
    ensureAudio();
    if (!audioCtx || !masterGain) {
      return;
    }
    var startAt = audioCtx.currentTime + (delaySec || 0);
    var attack = 0.018;
    var peakGain = peak || 0.11;
    function voice(hz, level) {
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = hz;
      osc.frequency.setValueAtTime(hz, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(level, startAt + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + seconds);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(startAt);
      osc.stop(startAt + seconds + 0.04);
    }
    voice(freq, peakGain);
    voice(freq * 2, peakGain * 0.1);
  }

  function playCellTone(index) {
    playBell(CELL_FREQS[index], 0.32, 0.1);
  }

  function playCorrectTone(index) {
    var freq = Math.min(CELL_FREQS[index] * 1.25, 620);
    playBell(freq, 0.28, 0.12);
  }

  function playSuccess() {
    playBell(329.63, 0.28, 0.1, 0);
    playBell(392.0, 0.3, 0.11, 0.13);
    playBell(523.25, 0.42, 0.13, 0.26);
  }

  function playWrong() {
    playBell(174.61, 0.48, 0.08);
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
    levelEl.textContent = String(Math.max(1, sequence.length - START_LENGTH + 1));
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
    ensureAudio();
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
      playCellTone(sequence[i]);
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
      playWrong();
      onWrongPress();
      return;
    }

    playerStep += 1;
    if (playerStep !== sequence.length) {
      playCorrectTone(index);
    }
    if (playerStep === sequence.length) {
      acceptingInput = false;
      setCellsEnabled(false);
      playSuccess();
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

  const LETTER_CODE_TO_INDEX = {
    KeyQ: 0,
    KeyW: 1,
    KeyE: 2,
    KeyA: 3,
    KeyS: 4,
    KeyD: 5,
    KeyZ: 6,
    KeyX: 7,
    KeyC: 8,
  };

  const LETTER_KEY_TO_INDEX = {
    q: 0,
    w: 1,
    e: 2,
    a: 3,
    s: 4,
    d: 5,
    z: 6,
    x: 7,
    c: 8,
  };

  function indexFromKey(event) {
    if (Object.prototype.hasOwnProperty.call(NUMPAD_CODE_TO_INDEX, event.code)) {
      return NUMPAD_CODE_TO_INDEX[event.code];
    }
    if (Object.prototype.hasOwnProperty.call(DIGIT_TO_INDEX, event.key)) {
      return DIGIT_TO_INDEX[event.key];
    }
    if (Object.prototype.hasOwnProperty.call(LETTER_CODE_TO_INDEX, event.code)) {
      return LETTER_CODE_TO_INDEX[event.code];
    }
    var letter = String(event.key).toLowerCase();
    if (Object.prototype.hasOwnProperty.call(LETTER_KEY_TO_INDEX, letter)) {
      return LETTER_KEY_TO_INDEX[letter];
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

  function openSettings() {
    settingsPanel.hidden = false;
    settingsToggleBtn.setAttribute("aria-expanded", "true");
  }

  function closeSettings() {
    settingsPanel.hidden = true;
    settingsToggleBtn.setAttribute("aria-expanded", "false");
  }

  settingsToggleBtn.addEventListener("click", function () {
    if (settingsPanel.hidden) {
      openSettings();
    } else {
      closeSettings();
    }
  });

  document.addEventListener("click", function (event) {
    if (settingsPanel.hidden) {
      return;
    }
    if (settingsPanel.contains(event.target) || settingsToggleBtn.contains(event.target)) {
      return;
    }
    closeSettings();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !settingsPanel.hidden) {
      closeSettings();
      settingsToggleBtn.focus();
    }
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
  soundToggleBtn.addEventListener("click", function () {
    applySound(soundOn ? "off" : "on");
    if (soundOn) {
      playBell(329.63, 0.22, 0.1);
    }
  });

  applyTheme(readStore(THEME_KEY, "dark"));
  applyLanguage(readStore(LANG_KEY, "en"));
  applySound(readStore(SOUND_KEY, "on"));
  setCellsEnabled(false);
  updateStats();
})();
