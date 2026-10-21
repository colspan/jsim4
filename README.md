# JSIM — Browser Japanese & Korean IME

The original **JSIM** (Colspan, 2009) rebuilt for the modern web.
Two self-contained IME pages, a trilingual landing page (JA / EN / KO), and a real
kana-kanji conversion engine powered by **Mozc compiled to WebAssembly**.

- **Japanese IME** — `japanese.html`
- **Korean IME** — `korean.html`
- **Landing page (JA / EN / KO)** — `index.html`

## What changed

| Before | After |
| --- | --- |
| Prototype.js-style classes and browser sniffing | ES2020, native DOM APIs, no framework |
| Yahoo! Japan API proxy for conversion | Mozc WASM running in a Web Worker |
| Floating buffer + separate candidate list | Caret-anchored composition and candidate popup |
| `Shift+Space` toggle only | Modern `Ctrl+Space` / `Alt+\`` toggle, JIS 英数/かな keys |
| Legacy `lib/` and `style/` assets | Vendored WASM engine + single-file pages |

## Run locally

The pages use a Web Worker, `fetch`, and WebAssembly, so they must be served
over HTTP (not opened as `file://`):

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

Any static host works — GitHub Pages, Netlify, Cloudflare Pages, S3, etc.
No build step and no server-side code.

## Japanese IME (`japanese.html`)

- Romaji → kana, then **Mozc WASM** converts kana to kanji in context.
- The dictionary `vendor/hechima-wasm/mozc.data.gz` (~13 MB) is downloaded
  once on first use and cached by the browser.
- Conversion, candidate selection, segment resizing, and learning run locally
  in a Web Worker. Input never leaves the browser.
- If the engine cannot initialize, hechima's kana/katakana fallback still works.

### Key bindings

| Action | Key |
| --- | --- |
| IME ON / OFF | `Ctrl` + `Space` / `Alt` + `` ` `` |
| Start conversion / next candidate | `Space` |
| Previous / additional candidate | `Shift` + `Space` |
| Move between candidates | `↑` `↓` |
| Move between segments | `←` `→` |
| Resize a segment | `Shift` + `←` / `→` |
| Commit | `Enter` |
| Cancel | `Esc` |
| Show more candidates | `Tab` |
| Undo commit | `Ctrl` + `Backspace` |
| Select candidate directly | `1`–`9` |
| Reconvert selected text | JIS `変換` / `Ctrl` + `/` |
| 英数 / かな | JIS `英数` / `かな` |

> Turn off the OS Japanese IME first to avoid conflicting shortcuts.

### Requirements

A modern browser with **WebAssembly** and **DecompressionStream**
(Chrome/Edge 80+, Firefox 113+, Safari 16.4+). The worker fetches
`mozc.data.gz` and expands it with `DecompressionStream`.

## Korean IME (`korean.html`)

A clean-room **dubeolsik** Hangul automaton implemented in the page:

- Initial / medial / final jamo composition
- Compound vowels (`ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ`, plus `ㅏ+ㅣ → ㅐ` etc.)
- Compound finals (`ㄳ ㄵ ㄶ ㄺ ㄻ ㄼ ㄽ ㄾ ㄿ ㅀ ㅄ`)
- Correct final-consonant migration when a vowel follows
  (e.g. `값` + `ㅏ` → `갑사`)
- Shift for double consonants (`ㅃ ㅉ ㄸ ㄲ ㅆ`) and `ㅒ` / `ㅖ`

### Key bindings

| Action | Key |
| --- | --- |
| 한 / 영 toggle | `Ctrl` + `Space` / `Shift` + `Space` / `Alt` + `` ` `` |
| 한글 ON | JIS `かな` |
| 영문 OFF | JIS `英数` |
| Cancel composition | `Esc` |
| Delete one jamo | `Backspace` |
| Commit + newline / space | `Enter` / `Space` |

> Turn off the OS Korean IME first. A physical keyboard is recommended;
> soft keyboards on mobile do not emit the `keydown` events this automaton uses.

## Structure

```
index.html                     trilingual landing page (inline CSS/JS)
japanese.html                  Mozc WASM Japanese IME (inline app code)
korean.html                    dubeolsik Korean IME (inline engine + UI)
vendor/
  hechima/hechima.js           conversion session layer (MIT)
  hechima/hechima-worker.js    Web Worker wrapper
  hechima-wasm/hechima-wasm.js Mozc Emscripten glue
  hechima-wasm/hechima-wasm.wasm
  hechima-wasm/mozc.data.gz    Mozc system dictionary (gzip)
  hechima-wasm/BUILD_INFO.txt
LICENSE                        MIT (original JSIM + new code)
THIRD_PARTY_NOTICES.md         Mozc / hechima / dictionary licenses
```

The application code for each page is inline, so a page is one HTML file plus
the shared `vendor/` engine assets. This keeps deployment trivial while avoiding
a 13 MB base64 blob inside the HTML.

## Credits

- Original JSIM by **Colspan** (2009), MIT.
- Conversion engine: **Mozc** (Google), BSD-3-Clause.
- Web session layer and WASM build: **hechima** by msonrm, MIT.
- Dictionary: Mozc system dictionary (BSD-3-Clause + NAIST License + Public Domain).

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for the full license texts.

## License

MIT — see [LICENSE](LICENSE). The vendored Mozc WASM and dictionary remain under
their respective licenses.
