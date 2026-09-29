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

## Features

- 3×3 sequence-memory gameplay, no timer
- Adaptive layout: on phones held upright the stats sit on top, the board
  fills the middle and the buttons sit at the bottom within thumb reach; on
  landscape screens (laptops, tablets, phones on their side) the controls
  move to a sidebar and the board uses the full height
- Progress dots show how far you are in the sequence, and the board frame
  turns green on your turn, orange (with a small shake) on a wrong press
- The “Try again” button shows how many free tries are left on the level,
  or the point cost once they're used up
- “How to play” opens as a dialog (shown automatically on the first visit)
- Settings (top right) for language (Norwegian/English), theme (light/dark)
  and sound — saved in `localStorage`
- Gentle audio feedback — soft bell-like tones on a pentatonic scale, no
  harsh beeps
- Respects `prefers-reduced-motion`

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
