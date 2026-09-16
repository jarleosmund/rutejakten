# Rutejakten (Grid Hunt)

A small, calm memory game built for cognitive training — designed with an older
audience in mind: large text, high contrast, no time pressure, and full
keyboard support.

Watch the sequence of squares light up, then repeat it in the same order.
Get it right and the sequence grows by one square. Get it wrong and you try
the same level again — no penalty, no game over.

## Play

Just open `index.html` in a browser. It's a fully static site — no build
step, no dependencies, no backend.

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

(Opening the file directly via `file://` also works in most browsers.)

## Controls

- **Mouse**: click a square
- **Keyboard**: press 1–9, or QWE / ASD / ZXC — both use the same physical
  layout as a numeric keypad (top row / middle row / bottom row), and work
  whether or not Num Lock is on
- **Voice** (optional, see below): say the number instead of pressing it

## Features

- 3×3 sequence-memory gameplay, no timer
- One small settings button (top right) opens a panel with language
  (Norwegian/English), theme (light/dark), sound, and voice controls —
  kept out of the way until you want them
- Defaults to dark theme, English, sound on; saved choices override these
  on your next visit via `localStorage`
- Gentle audio feedback — soft bell-like tones on a pentatonic scale, no
  harsh beeps
- Optional voice mode: the sequence is read aloud (Web Speech API text-to-
  speech) and you can answer by speaking the number instead of clicking.
  Off by default; turning it on asks for microphone access. Speech
  recognition support varies by browser (best in Chrome), and in Chrome the
  audio is sent to Google's servers for transcription rather than
  processed on-device — mouse and keyboard always keep working as a
  fallback.
- Responsive, compact layout — the whole board fits on screen without
  scrolling, on both mobile and desktop

## Project structure

```
index.html   markup, i18n strings, theme/lang preference bootstrapping
style.css    layout + light/dark theme variables
script.js    game logic, keyboard handling, i18n and theme switching
```

## Credits

Built as a small multi-agent experiment: one agent designed the game
concept, another implemented and iterated on it, and a third reviewed the
result.
