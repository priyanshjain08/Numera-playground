# Numera — The Little Number Lab

Numera turns the original menu-driven C number-system assignment into an interactive browser playground. It keeps the twelve original conversion directions and the familiar terminal flow: choose an option, enter a value, then continue the same conversion, return to the menu, or exit.

## Features

- Editable C source panel with line numbers, tab indentation, restore-source control, and `Ctrl/Cmd + Enter` shortcut.
- Interactive terminal-style input and output.
- Actual C conversion logic compiled to WebAssembly; the browser calls the exported C function for each conversion.
- All twelve original conversions:
  1. Decimal → Binary
  2. Decimal → Octal
  3. Decimal → Hexadecimal
  4. Binary → Decimal
  5. Binary → Octal
  6. Binary → Hexadecimal
  7. Octal → Decimal
  8. Octal → Binary
  9. Octal → Hexadecimal
  10. Hexadecimal → Decimal
  11. Hexadecimal → Binary
  12. Hexadecimal → Octal
- Input validation, overflow detection, clear and stop controls.
- Pastel, responsive interface. No backend and no external runtime service.

## Run locally

Because the page loads the C source and WebAssembly file with `fetch`, serve the folder over HTTP rather than opening `index.html` directly as a `file://` URL.

For example, with Python installed:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.


The prebuilt `wasm/converter.wasm` is included, so GitHub Pages does not need to compile C during deployment.

## Editing the C program and rebuilding WebAssembly

The source editor is editable, but browser execution uses the already-compiled `wasm/converter.wasm`. Editing the text area does not compile arbitrary new C code inside the browser. To make source changes part of the running program:

1. Edit `src/converter.c` in your project.
2. Install Clang with its WebAssembly target and `wasm-ld` (the included script uses a freestanding build and does not need the Emscripten runtime).
3. Run the build script from the project root:

   ```bash
   ./compile-wasm.sh
   ```

4. Commit and push the updated `src/converter.c` and `wasm/converter.wasm` to GitHub.

`build-wasm.sh` is a convenience alias for `compile-wasm.sh`. The included prebuilt artifact was produced with the tested Clang WebAssembly build.

<!--## Notes about the original assignment

The original program used `conio.h`, `getch()`, `system("cls")`, `gets()`, `strrev()`, recursive calls to `main()`, and platform-specific console behavior. Those pieces are not portable to a browser. The twelve menu choices and conversion behavior are retained, while terminal interaction is presented by the webpage and the conversion arithmetic is performed by the compiled C WebAssembly module.

The C engine supports non-negative integer input in bases 2, 8, 10, and 16, up to the unsigned 32-bit limit. Hexadecimal input is case-insensitive. Prefixes such as `0x` are not required.
-->
## Project structure

```text
numera-playground/
├── index.html
├── README.md
├── build-wasm.sh
├── compile-wasm.sh
├── css/
│   └── style.css
├── js/
│   └── app.js
├── src/
│   └── converter.c
└── wasm/
    └── converter.wasm
```

