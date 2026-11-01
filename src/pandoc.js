/**
 * Adapted from https://github.com/haskell-wasm/pandoc-wasm
 * See README.md for more details about the pandoc WASM integration.
 */

/** @import * as PandocWasm from '../types/pandoc-wasm.js' */
/** @import * as WasiShimT from '@bjorn3/browser_wasi_shim' */

const isBrowser = typeof window !== 'undefined';

let WasiShim;
if (isBrowser) {
  WasiShim = await import('@bjorn3/browser_wasi_shim');
} else {
  WasiShim = await import('@bjorn3/browser_wasi_shim');
}

/** @type {typeof WasiShimT} */
const {WASI, OpenFile, File, ConsoleStdout, PreopenDirectory} = WasiShim;

const args = ['pandoc.wasm', '+RTS', '-H64m', '-RTS'];
/** @type {string[]} */
const env = [];
const initial_in_file = new File(new Uint8Array(), {readonly: true});
const initial_out_file = new File(new Uint8Array(), {readonly: false});
/** @type {WasiShimT.File | null} */
let in_file = initial_in_file;
/** @type {WasiShimT.File | null} */
let out_file = initial_out_file;
const fds = [
  new OpenFile(new File(new Uint8Array(), {readonly: true})),
  ConsoleStdout.lineBuffered((/** @type {string} */ msg) => console.log(`[WASI stdout] ${msg}`)),
  ConsoleStdout.lineBuffered((/** @type {string} */ msg) => console.warn(`[WASI stderr] ${msg}`)),
  new PreopenDirectory(
    '/',
    new Map([
      ['in', initial_in_file],
      ['out', initial_out_file],
    ])
  ),
];
const options = {debug: false};
/** @type {WasiShimT.WASI | null} */
let wasi = new WASI(args, env, fds, options);

async function loadWasm() {
  if (!wasi) {
    throw new Error('WASI is not initialized');
  }
  if (isBrowser) {
    const response = await fetch('third_party/pandoc.wasm');
    const bytes = await response.arrayBuffer();
    return await WebAssembly.instantiate(bytes, {
      wasi_snapshot_preview1: wasi.wasiImport,
    });
  } else {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const {fileURLToPath} = await import('node:url');
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const wasmPath = path.join(__dirname, '..', 'third_party', 'pandoc.wasm');
    const bytes = fs.readFileSync(wasmPath);
    return await WebAssembly.instantiate(bytes, {
      wasi_snapshot_preview1: wasi.wasiImport,
    });
  }
}

const source = await loadWasm();
/** @type {PandocWasm.PandocWasmInstance | null} */
let instance = /** @type {PandocWasm.PandocWasmInstance} */ (source.instance);

if (wasi) {
  wasi.initialize(instance);
}
instance.exports.__wasm_call_ctors();

function memory_data_view() {
  if (!instance) {
    throw new Error('Pandoc WASM instance not found');
  }
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

/**
 * @param {string} args_str
 * @param {string} in_str
 * @returns {string}
 */
export function pandoc(args_str, in_str) {
  if (!instance || !in_file || !out_file) {
    throw new Error('Pandoc WASM instance is not initialized or disposed');
  }
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
