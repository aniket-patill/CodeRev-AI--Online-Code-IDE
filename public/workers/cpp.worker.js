/**
 * C++ worker: receives WASM binary from compile API, instantiates and runs,
 * captures console.log/console.error. Expects Emscripten-style exports (e.g. _main).
 */

let consoleBuf = { stdout: [], stderr: [] };

function captureConsole() {
  const origLog = self.console.log;
  const origError = self.console.error;
  self.console.log = function (...args) {
    const text = args.map(function (x) { return String(x); }).join(' ');
    for (let i = 0; i < text.length; i++) {
      self.postMessage({ type: 'stdout', data: text[i] });
    }
    origLog.apply(self.console, args);
  };
  self.console.error = function (...args) {
    const text = args.map(function (x) { return String(x); }).join(' ');
    for (let i = 0; i < text.length; i++) {
      self.postMessage({ type: 'stderr', data: text[i] });
    }
    origError.apply(self.console, args);
  };
}

function flushConsole() {
  consoleBuf = { stdout: [], stderr: [] };
}

self.onmessage = async function (event) {
  const { type, wasm, input } = event.data || {};
  if (type !== 'run' || !wasm) {
    self.postMessage({ type: 'error', data: 'Missing run payload or wasm' });
    return;
  }

  captureConsole();

  try {
    const module = await WebAssembly.instantiate(wasm);
    const exports = module.instance.exports;

    if (typeof exports._main === 'function') {
      try {
        exports._main();
      } catch (e) {
        self.postMessage({ type: 'stderr', data: (e && e.message) || String(e) + '\n' });
      }
    } else if (typeof exports.run === 'function') {
      try {
        exports.run();
      } catch (e) {
        self.postMessage({ type: 'stderr', data: (e && e.message) || String(e) + '\n' });
      }
    } else {
      self.postMessage({ type: 'error', data: 'WASM has no _main or run export' });
      flushConsole();
      self.postMessage({ type: 'exit', data: 1 });
      return;
    }

    flushConsole();
    self.postMessage({ type: 'exit', data: 0 });
  } catch (err) {
    self.postMessage({ type: 'stderr', data: (err && err.message) || String(err) + '\n' });
    flushConsole();
    self.postMessage({ type: 'error', data: (err && err.message) || String(err) });
    self.postMessage({ type: 'exit', data: 1 });
  }
};
