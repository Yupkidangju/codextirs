export async function loadWasmMath() {
  try {
    const resp = await fetch("./wasm/ai_engine/ai_math.wasm");
    const buf = await resp.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(buf, {});
    return instance.exports;
  } catch {
    return { add: (a, b) => (a + b) | 0 };
  }
}
