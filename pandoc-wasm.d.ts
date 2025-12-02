interface PandocWasmExports extends WebAssembly.Exports {
  __wasm_call_ctors: () => void;
  memory: WebAssembly.Memory;
  malloc: (size: number) => number;
  hs_init_with_rtsopts: (argc_ptr: number, argv_ptr: number) => void;
  wasm_main: (args_ptr: number, args_len: number) => void;
}

interface PandocWasmInstance extends WebAssembly.Instance {
  exports: PandocWasmExports;
}
