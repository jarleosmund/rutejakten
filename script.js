(function () {
  const START_LENGTH = 2;
  const FLASH_MS = 650;
  const GAP_MS = 280;
  const PAUSE_BEFORE_MS = 700;
  const PAUSE_AFTER_MS = 450;
  const LANG_KEY = "rutejakten-lang";
  const THEME_KEY = "rutejakten-theme";
  const SOUND_KEY = "rutejakten-sound";
  const VOICE_KEY = "rutejakten-voice";
  const SPEAK_WORDS = {
    no: {
      1: "en",
      2: "to",
      3: "tre",
      4: "fire",
      5: "fem",
      6: "seks",
      7: "syv",
      8: "åtte",
      9: "ni",
    },
    en: {
      1: "one",
      2: "two",
      3: "three",
      4: "four",
      5: "five",
      6: "six",
      7: "seven",
      8: "eight",
      9: "nine",
    },
  };
  const SPEECH_ALIASES = {
    1: ["1", "one", "en", "ett", "ein"],
    2: ["2", "two", "to", "too"],
    3: ["3", "three", "tre"],
    4: ["4", "four", "fire", "for"],
    5: ["5", "five", "fem"],
    6: ["6", "six", "seks"],
    7: ["7", "seven", "sju", "syv"],
    8: ["8", "eight", "åtte", "atte", "otte"],
    9: ["9", "nine", "ni"],
  };
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
      voiceGroup: "Stemme",
      voiceOn: "Stemme på",
      voiceOff: "Stemme av",
      yourTurnVoice: "Din tur. Si tallet, eller trykk ruten.",
      voiceDenied:
        "Mikrofonen er ikke tilgjengelig. Du kan fortsatt spille med klikk eller tastatur.",
      voiceUnsupported:
        "Stemme støttes ikke i denne nettleseren. Du kan spille med klikk eller tastatur.",
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
      voiceGroup: "Voice",
      voiceOn: "Voice on",
      voiceOff: "Voice off",
      yourTurnVoice: "Your turn. Say the number, or press the tile.",
      voiceDenied:
        "The microphone is not available. You can still play with clicks or the keyboard.",
      voiceUnsupported:
        "Voice is not supported in this browser. You can play with clicks or the keyboard.",
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
  const voiceToggleBtn = document.getElementById("voice-toggle");
  const voiceHintEl = document.getElementById("voice-hint");
  const settingsToggleBtn = document.getElementById("settings-toggle");
  const settingsPanel = document.getElementById("settings-panel");
  function getSpeechRec() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  let lang = "no";
  let theme = "dark";
  let soundOn = true;
  let voiceOn = false;
  let recognizer = null;
  let listening = false;
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
    updateVoiceButton();
    if (voiceHintEl && !voiceHintEl.hidden) {
      voiceHintEl.textContent = t(
        getSpeechRec() ? "voiceDenied" : "voiceUnsupported"
      );
    }
    if (recognizer) {
      recognizer.lang = speechLang();
    }
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

  function speechLang() {
    return lang === "en" ? "en-US" : "nb-NO";
  }

  function digitForIndex(index) {
    return cells[index] ? cells[index].textContent.trim() : "";
  }

  function updateVoiceButton() {
    var label = voiceToggleBtn.querySelector(".pref-btn-label");
    if (label) {
      label.textContent = t(voiceOn ? "voiceOn" : "voiceOff");
    }
    setPressed(voiceToggleBtn, voiceOn);
  }

  function showVoiceHint(key) {
    if (!voiceHintEl) {
      return;
    }
    voiceHintEl.hidden = false;
    voiceHintEl.textContent = t(key);
  }

  function hideVoiceHint() {
    if (!voiceHintEl || voiceToggleBtn.disabled) {
      return;
    }
    voiceHintEl.hidden = true;
    voiceHintEl.textContent = "";
  }

  function cancelSpeech() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  function stopListening() {
    listening = false;
    if (recognizer) {
      try {
        recognizer.onend = null;
        recognizer.abort();
      } catch (e) {}
    }
  }

  function failVoice(messageKeyName) {
    voiceOn = false;
    writeStore(VOICE_KEY, "off");
    updateVoiceButton();
    stopListening();
    cancelSpeech();
    showVoiceHint(messageKeyName);
    setMessage(messageKeyName, "is-warn");
  }

  function applyVoice(next) {
    voiceOn = next === "on";
    writeStore(VOICE_KEY, voiceOn ? "on" : "off");
    updateVoiceButton();
    if (!voiceOn) {
      stopListening();
      cancelSpeech();
      if (messageKey === "yourTurnVoice") {
        setMessage("yourTurn");
      }
      return;
    }
    hideVoiceHint();
    if (messageKey === "yourTurn") {
      setMessage("yourTurnVoice");
    }
    syncListening();
  }

  function escapeRe(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function hasWord(text, word) {
    return new RegExp("(^|\\s)" + escapeRe(word) + "($|\\s)", "i").test(text);
  }

  function parseSpokenIndex(raw) {
    var text = String(raw || "")
      .toLowerCase()
      .replace(/[.,!?]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) {
      return null;
    }
    var digits = ["7", "8", "9", "4", "5", "6", "1", "2", "3"];
    for (var i = 0; i < digits.length; i += 1) {
      var aliases = SPEECH_ALIASES[digits[i]] || [];
      for (var a = 0; a < aliases.length; a += 1) {
        if (hasWord(text, aliases[a])) {
          return i;
        }
      }
    }
    return null;
  }

  function isExactNumberWord(raw) {
    var text = String(raw || "")
      .toLowerCase()
      .replace(/[.,!?]/g, " ")
      .trim();
    var keys = Object.keys(SPEECH_ALIASES);
    for (var i = 0; i < keys.length; i += 1) {
      var aliases = SPEECH_ALIASES[keys[i]];
      for (var a = 0; a < aliases.length; a += 1) {
        if (text === aliases[a]) {
          return true;
        }
      }
    }
    return false;
  }

  function handleSpeechResult(event) {
    if (!voiceOn || !acceptingInput) {
      return;
    }
    for (var i = event.resultIndex; i < event.results.length; i += 1) {
      var result = event.results[i];
      var pieces = [];
      for (var a = 0; a < result.length; a += 1) {
        pieces.push(result[a].transcript);
      }
      var index = parseSpokenIndex(pieces.join(" "));
      if (index === null) {
        continue;
      }
      if (result.isFinal || isExactNumberWord(result[0] && result[0].transcript)) {
        handlePress(index);
        return;
      }
    }
  }

  function ensureRecognizer() {
    var Rec = getSpeechRec();
    if (!Rec || recognizer) {
      return recognizer;
    }
    recognizer = new Rec();
    recognizer.continuous = true;
    recognizer.interimResults = true;
    recognizer.maxAlternatives = 5;
    recognizer.lang = speechLang();
    recognizer.onresult = handleSpeechResult;
    recognizer.onerror = function (event) {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        failVoice("voiceDenied");
      }
    };
    recognizer.onend = function () {
      listening = false;
      if (voiceOn && acceptingInput) {
        startListening();
      }
    };
    return recognizer;
  }

  function startListening() {
    if (!voiceOn || !acceptingInput || !getSpeechRec()) {
      return;
    }
    var rec = ensureRecognizer();
    if (!rec) {
      return;
    }
    rec.lang = speechLang();
    rec.onresult = handleSpeechResult;
    rec.onend = function () {
      listening = false;
      if (voiceOn && acceptingInput) {
        startListening();
      }
    };
    try {
      rec.start();
      listening = true;
    } catch (e) {}
  }

  function syncListening() {
    if (voiceOn && acceptingInput) {
      startListening();
    } else {
      stopListening();
    }
  }

  function speakDigit(index) {
    return new Promise(function (resolve) {
      if (!voiceOn || !window.speechSynthesis) {
        resolve();
        return;
      }
      var digit = digitForIndex(index);
      var words = SPEAK_WORDS[lang] || SPEAK_WORDS.no;
      var phrase = words[digit];
      if (!phrase) {
        resolve();
        return;
      }
      cancelSpeech();
      var utter = new SpeechSynthesisUtterance(phrase);
      utter.lang = speechLang();
      utter.rate = 0.92;
      utter.pitch = 1;
      utter.volume = 1;
      var voices = window.speechSynthesis.getVoices() || [];
      var match = voices.filter(function (voice) {
        return voice.lang && voice.lang.toLowerCase().indexOf(utter.lang.toLowerCase().slice(0, 2)) === 0;
      })[0];
      if (match) {
        utter.voice = match;
      }
      var settled = false;
      function finish() {
        if (settled) {
          return;
        }
        settled = true;
        resolve();
      }
      utter.onend = finish;
      utter.onerror = finish;
      window.speechSynthesis.speak(utter);
      setTimeout(finish, 1600);
    });
  }

  async function requestMicAccess() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return true;
    }
    var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (stream && stream.getTracks) {
      stream.getTracks().forEach(function (track) {
        track.stop();
      });
    }
    return true;
  }

  function enableVoice() {
    if (!getSpeechRec()) {
      failVoice("voiceUnsupported");
      return;
    }
    requestMicAccess()
      .then(function () {
        applyVoice("on");
      })
      .catch(function () {
        failVoice("voiceDenied");
      });
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

  async function announceAndFlash(index) {
    if (voiceOn && window.speechSynthesis) {
      await Promise.all([
        flashCell(index, "is-lit", FLASH_MS),
        speakDigit(index),
      ]);
      return;
    }
    playCellTone(index);
    await flashCell(index, "is-lit", FLASH_MS);
  }

  async function playSequence(key, kind) {
    const token = roundToken;
    acceptingInput = false;
    playerStep = 0;
    setCellsEnabled(false);
    stopListening();
    cancelSpeech();
    clearCellStates();
    setMessage(key || "watch", kind);
    updateStats();

    await delay(PAUSE_BEFORE_MS);
    if (token !== roundToken) {
      return;
    }

    for (let i = 0; i < sequence.length; i += 1) {
      await announceAndFlash(sequence[i]);
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
    setMessage(voiceOn ? "yourTurnVoice" : "yourTurn");
    syncListening();
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
      stopListening();
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
      stopListening();
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
  voiceToggleBtn.addEventListener("click", function () {
    if (voiceToggleBtn.disabled) {
      return;
    }
    if (voiceOn) {
      applyVoice("off");
    } else {
      enableVoice();
    }
  });

  if (!getSpeechRec()) {
    voiceToggleBtn.disabled = true;
    showVoiceHint("voiceUnsupported");
  }

  applyTheme(readStore(THEME_KEY, "dark"));
  applyLanguage(readStore(LANG_KEY, "en"));
  applySound(readStore(SOUND_KEY, "on"));
  applyVoice(readStore(VOICE_KEY, "off") === "on" ? "on" : "off");
  if (voiceOn && !getSpeechRec()) {
    applyVoice("off");
    showVoiceHint("voiceUnsupported");
  }
  setCellsEnabled(false);
  updateStats();
})();
