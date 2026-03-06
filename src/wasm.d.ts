declare module "@resvg/resvg-wasm/index_bg.wasm" {
  const wasm: ArrayBuffer;
  export default wasm;
}

declare module "*.wasm" {
  const wasm: ArrayBuffer;
  export default wasm;
}
