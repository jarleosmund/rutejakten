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
- **Keyboard**: press 1–9, using the same physical layout as a numeric
  keypad (7-8-9 top row, 4-5-6 middle row, 1-2-3 bottom row) — works whether
  or not Num Lock is on

## Features

- 3×3 sequence-memory gameplay, no timer
- Norwegian / English language toggle (top left)
- Light / dark theme toggle (top right), both tuned for high contrast
- Preferences (language + theme) are remembered via `localStorage`
- Responsive, compact layout — the whole board fits on screen without
  scrolling

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
