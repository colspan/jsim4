# Vendored engine assets

These files are copied from the [hechima](https://github.com/msonrm/hechima)
project and are not modified.

| Path | Contents | Version / source |
| --- | --- | --- |
| `hechima/hechima.js` | Conversion session layer (UMD, global `Hechima`) | hechima v0.25.0 |
| `hechima/hechima-worker.js` | Worker wrapper for the WASM engine | hechima v0.25.0 |
| `hechima-wasm/hechima-wasm.js` | Mozc Emscripten glue | hechima-wasm v0.7.1 + single-thread build |
| `hechima-wasm/hechima-wasm.wasm` | Mozc WebAssembly binary | same as above |
| `hechima-wasm/mozc.data.gz` | Mozc system dictionary, gzip -9 compressed | from hechima v0.7.1 `mozc.data` |
| `hechima-wasm/BUILD_INFO.txt` | Build provenance (Mozc / fcitx5-mozc / emsdk) | upstream |

The dictionary is served as `mozc.data.gz`; `hechima-worker.js` tries
`<dataUrl>.gz` first and expands it with `DecompressionStream`, falling back
to an uncompressed `<dataUrl>` if present. This repository only ships the
compressed file, so a browser with `DecompressionStream` is required for
Mozc conversion.

## Updating

1. Replace the files from the same hechima release (keep the set in sync).
2. Regenerate the dictionary:

   ```bash
   gzip -9 -c mozc.data > mozc.data.gz
   ```

3. Update this file and `THIRD_PARTY_NOTICES.md` if licenses or versions change.

Licenses: hechima is MIT; Mozc, fcitx5-mozc, and the dictionary have their own
terms. See [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md).
