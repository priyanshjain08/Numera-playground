const $ = (selector) => document.querySelector(selector);
const editor = $('#codeEditor');
const terminal = $('#terminal');
const terminalInput = $('#terminalInput');
const statusEl = $('#status');
const runBtn = $('#runBtn');
const sendBtn = $('#sendBtn');
const lineNumbers = $('#lineNumbers');

const menu = [
  { key: '1', label: 'Decimal To Binary', from: 10, to: 2, prompt: 'Enter a Decimal Number -- ' },
  { key: '2', label: 'Decimal To Octal', from: 10, to: 8, prompt: 'Enter a Decimal Number -- ' },
  { key: '3', label: 'Decimal To HexaDecimal', from: 10, to: 16, prompt: 'Enter a Decimal Number -- ' },
  { key: '4', label: 'Binary To Decimal', from: 2, to: 10, prompt: 'Enter a Binary Number -- ' },
  { key: '5', label: 'Binary To Octal', from: 2, to: 8, prompt: 'Enter a Binary Number -- ' },
  { key: '6', label: 'Binary To HexaDecimal', from: 2, to: 16, prompt: 'Enter a Binary Number -- ' },
  { key: '7', label: 'Octal To Decimal', from: 8, to: 10, prompt: 'Enter an Octal Number -- ' },
  { key: '8', label: 'Octal To Binary', from: 8, to: 2, prompt: 'Enter an Octal Number -- ' },
  { key: '9', label: 'Octal To HexaDecimal', from: 8, to: 16, prompt: 'Enter an Octal Number -- ' },
  { key: 'A', label: 'HexaDecimal To Decimal', from: 16, to: 10, prompt: 'Enter a HexaDecimal Number -- ' },
  { key: 'B', label: 'HexaDecimal To Binary', from: 16, to: 2, prompt: 'Enter a HexaDecimal Number -- ' },
  { key: 'C', label: 'HexaDecimal To Octal', from: 16, to: 8, prompt: 'Enter a HexaDecimal Number -- ' }
];

let wasmExports = null;
let mode = 'stopped'; // stopped | menu | value | after
let selected = null;
let lastInput = '';
let busy = false;

const baseName = (base) => ({2:'Binary', 8:'Octal', 10:'Decimal', 16:'Hexadecimal'}[base]);
function setStatus(label, kind = 'ready') {
  statusEl.className = `terminal-status ${kind}`;
  statusEl.innerHTML = `<i></i> ${label}`;
}
function appendLine(text = '', kind = '') {
  const line = document.createElement('div');
  line.className = `terminal-line ${kind}`;
  line.textContent = text;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}
function clearTerminal() { terminal.innerHTML = ''; }
function printMenu() {
  appendLine('Number System Converter', 'term-title');
  appendLine('────────────────────────────────────────');
  menu.forEach(item => appendLine(`${item.key}.  ${item.label}`));
  appendLine('E.  Exit');
  appendLine('');
  appendLine('Enter Your Choice..', 'term-prompt');
  mode = 'menu';
  focusInput();
}
function focusInput() {
  terminalInput.disabled = false;
  sendBtn.disabled = false;
  terminalInput.placeholder = 'Type here and press Enter…';
  terminalInput.focus();
}
function lockInput(placeholder = 'Run the program to start typing…') {
  terminalInput.disabled = true;
  sendBtn.disabled = true;
  terminalInput.value = '';
  terminalInput.placeholder = placeholder;
}
function startProgram() {
  if (!wasmExports) {
    appendLine('The WebAssembly module could not be loaded. Check that wasm/converter.wasm exists.', 'term-error');
    setStatus('Load error', 'error');
    return;
  }
  clearTerminal();
  appendLine('Numera · Number System Converter', 'term-title');
  appendLine('C program started in WebAssembly.', 'term-muted');
  appendLine('');
  setStatus('Running', 'running');
  printMenu();
}
function stopProgram(message = 'Program stopped.') {
  mode = 'stopped'; selected = null;
  appendLine(''); appendLine(message, 'term-muted');
  lockInput(); setStatus('Stopped', 'ready');
}
function memoryString(ptr, max = 256) {
  const bytes = new Uint8Array(wasmExports.memory.buffer, ptr, max);
  let end = bytes.indexOf(0);
  if (end < 0) end = max;
  return new TextDecoder().decode(bytes.subarray(0, end));
}
function runCConversion(value, item) {
  const memory = new Uint8Array(wasmExports.memory.buffer);
  const inputBytes = new TextEncoder().encode(value + '\0');
  const inputPtr = 8192;
  const outputPtr = 8448;
  memory.fill(0, inputPtr, inputPtr + 256);
  memory.fill(0, outputPtr, outputPtr + 256);
  memory.set(inputBytes.subarray(0, 255), inputPtr);
  const resultCode = wasmExports.numera_convert(inputPtr, item.from, item.to, outputPtr, 256);
  return { code: resultCode, result: memoryString(outputPtr, 256) };
}
function processInput(raw) {
  const value = raw.trim();
  if (mode === 'menu') {
    const choice = value.toUpperCase();
    if (choice === 'E') { appendLine('Thanks for Using Numera!', 'term-success'); stopProgram('Session ended. Press Run program to start again.'); return; }
    selected = menu.find(item => item.key === choice);
    if (!selected) { appendLine('Please choose a valid option from 1–9, A–C, or E.', 'term-error'); appendLine('Enter Your Choice..', 'term-prompt'); return; }
    appendLine(selected.label, 'term-accent');
    appendLine(selected.prompt, 'term-prompt');
    mode = 'value';
    return;
  }
  if (mode === 'value') {
    const converted = runCConversion(value, selected);
    if (converted.code === 0) {
      appendLine(`${baseName(selected.to)} of ${baseName(selected.from)} number ${value.toUpperCase()} is -- ${converted.result}`, 'term-success');
    } else if (converted.code === 2) {
      appendLine('That number is too large for this 64-bit converter.', 'term-error');
    } else {
      appendLine(`Invalid ${baseName(selected.from)} input. Please check the digits and try again.`, 'term-error');
    }
    appendLine('');
    appendLine('Press 1 to continue this conversion, 2 for Main Menu, or 3 to Exit.', 'term-prompt');
    mode = 'after';
    return;
  }
  if (mode === 'after') {
    if (value === '1') {
      appendLine(selected.prompt, 'term-prompt');
      mode = 'value';
    } else if (value === '2') {
      appendLine(''); printMenu();
    } else if (value === '3') {
      appendLine('Thanks for Using Numera!', 'term-success'); stopProgram('Session ended. Press Run program to start again.');
    } else {
      appendLine('Please enter 1, 2, or 3.', 'term-error');
      appendLine('Press 1 to continue this conversion, 2 for Main Menu, or 3 to Exit.', 'term-prompt');
    }
  }
}

$('#terminalForm').addEventListener('submit', (event) => {
  event.preventDefault();
  if (terminalInput.disabled || busy || mode === 'stopped') return;
  const raw = terminalInput.value;
  if (!raw.trim()) return;
  appendLine(`❯ ${raw}`, 'term-input-echo');
  terminalInput.value = '';
  processInput(raw);
  terminal.scrollTop = terminal.scrollHeight;
  if (mode !== 'stopped') terminalInput.focus();
});

runBtn.addEventListener('click', startProgram);
$('#stopBtn').addEventListener('click', () => stopProgram());
$('#clearBtn').addEventListener('click', () => { clearTerminal(); if (mode !== 'stopped') appendLine('Terminal cleared. The program is still running.', 'term-muted'); else appendLine('Terminal cleared. Press Run program to begin.', 'term-muted'); });
$('#restoreBtn').addEventListener('click', async () => {
  try {
    const response = await fetch('src/converter.c');
    if (!response.ok) throw new Error('Source unavailable');
    editor.value = await response.text(); updateEditor();
    $('#editorCount').textContent = 'ORIGINAL C SOURCE RESTORED';
  } catch { $('#editorCount').textContent = 'Could not reload source file'; }
});
editor.addEventListener('input', updateEditor);
function updateEditor() {
  const lines = editor.value.split('\n').length;
  lineNumbers.textContent = Array.from({length: lines}, (_, i) => i + 1).join('\n');
  $('#editorCount').textContent = `${lines} LINES · EDITABLE C SOURCE`;
}
editor.addEventListener('scroll', () => { lineNumbers.scrollTop = editor.scrollTop; });
editor.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') {
    event.preventDefault();
    const start = editor.selectionStart, end = editor.selectionEnd;
    editor.setRangeText('    ', start, end, 'end'); updateEditor();
  }
});
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); startProgram(); }
});

async function boot() {
  try {
    const [sourceResponse, wasmResponse] = await Promise.all([fetch('src/converter.c'), fetch('wasm/converter.wasm')]);
    if (!sourceResponse.ok) throw new Error('Could not load src/converter.c');
    editor.value = await sourceResponse.text(); updateEditor();
    if (!wasmResponse.ok) throw new Error('Could not load wasm/converter.wasm');
    const bytes = await wasmResponse.arrayBuffer();
    const result = await WebAssembly.instantiate(bytes, {});
    wasmExports = result.instance.exports;
    if (!wasmExports.numera_convert || !wasmExports.memory) throw new Error('The WebAssembly build is missing required exports.');
    setStatus('Ready', 'ready');
    $('#editorCount').textContent = `${editor.value.split('\n').length} LINES · EDITABLE C SOURCE`;
  } catch (error) {
    setStatus('Unavailable', 'error');
    clearTerminal();
    appendLine('Numera could not initialize.', 'term-error');
    appendLine(error.message, 'term-muted');
    appendLine('Run the project through a local web server or GitHub Pages; opening index.html as a file may block WebAssembly loading.', 'term-muted');
  }
}
boot();
