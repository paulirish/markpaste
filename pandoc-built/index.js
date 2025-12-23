/**
 * Adapted from https://github.com/haskell-wasm/pandoc-wasm
 * See README.md for more details about the pandoc WASM integration.
 */

/** @import * as PandocWasm from '../pandoc-wasm.js' */
/** @import * as WasiShimT from '@bjorn3/browser_wasi_shim' */

const isBrowser = typeof window !== 'undefined';

let WasiShim;
if (isBrowser) {
  WasiShim = await import('@bjorn3/browser_wasi_shim');
} else {
  WasiShim = await import('@bjorn3/browser_wasi_shim');
}

/** @type {WasiShimT} */
const {WASI, OpenFile, File, ConsoleStdout, PreopenDirectory} = WasiShim;

const args = ['pandoc.wasm', '+RTS', '-H64m', '-RTS'];
const env = [];
let in_file = new File(new Uint8Array(), {readonly: true});
let out_file = new File(new Uint8Array(), {readonly: false});
const fds = [
  new OpenFile(new File(new Uint8Array(), {readonly: true})),
  ConsoleStdout.lineBuffered(msg => console.log(`[WASI stdout] ${msg}`)),
  ConsoleStdout.lineBuffered(msg => console.warn(`[WASI stderr] ${msg}`)),
  new PreopenDirectory(
    '/',
    new Map([
      ['in', in_file],
      ['out', out_file],
    ])
  ),
];
const options = {debug: false};
let wasi = new WASI(args, env, fds, options);

async function loadWasm() {
  if (isBrowser) {
    const response = await fetch('/pandoc-built/pandoc.wasm');
    const bytes = await response.arrayBuffer();
    return await WebAssembly.instantiate(bytes, {
      wasi_snapshot_preview1: wasi.wasiImport,
    });
  } else {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const wasmPath = path.join(__dirname, 'pandoc.wasm');
    const bytes = fs.readFileSync(wasmPath);
    return await WebAssembly.instantiate(bytes, {
      wasi_snapshot_preview1: wasi.wasiImport,
    });
  }
}

const source = await loadWasm();
let instance = /** @type {PandocWasm.PandocWasmInstance} */ (source.instance);

wasi.initialize(instance);
instance.exports.__wasm_call_ctors();

function memory_data_view() {
  return new DataView(instance.exports.memory.buffer);
}

const argc_ptr = instance.exports.malloc(4);
memory_data_view().setUint32(argc_ptr, args.length, true);
const argv = instance.exports.malloc(4 * (args.length + 1));
for (let i = 0; i < args.length; ++i) {
  const arg = instance.exports.malloc(args[i].length + 1);
  new TextEncoder().encodeInto(args[i], new Uint8Array(instance.exports.memory.buffer, arg, args[i].length));
  memory_data_view().setUint8(arg + args[i].length, 0);
  memory_data_view().setUint32(argv + 4 * i, arg, true);
}
memory_data_view().setUint32(argv + 4 * args.length, 0, true);
const argv_ptr = instance.exports.malloc(4);
memory_data_view().setUint32(argv_ptr, argv, true);

instance.exports.hs_init_with_rtsopts(argc_ptr, argv_ptr);

export function pandoc(args_str, in_str) {
  const args_ptr = instance.exports.malloc(args_str.length);
  new TextEncoder().encodeInto(args_str, new Uint8Array(instance.exports.memory.buffer, args_ptr, args_str.length));
  in_file.data = new TextEncoder().encode(in_str);
  instance.exports.wasm_main(args_ptr, args_str.length);
  return new TextDecoder('utf-8', {fatal: true}).decode(out_file.data);
}

export function dispose() {
  in_file = null;
  out_file = null;
  wasi = null;
  instance = null;
}