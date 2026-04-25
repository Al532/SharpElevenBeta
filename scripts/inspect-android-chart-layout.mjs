import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import net from 'node:net';
import { spawnSync } from 'node:child_process';

const DEFAULT_ADB = 'C:\\Users\\Alcibiade\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
const DEFAULT_PORT = 9222;
const OUTPUT_PATH = '.codex-live-reload-logs/android-chart-layout-debug.json';
const LAYOUT_PIPELINE_STEPS = [
  'barLinePlacement',
  'displacement',
  'rowResizing',
  'compression',
  'postCompressionDisplacement',
  'rowGap',
  'firstRowHeaderShift',
  'endingMargins',
  'annotationPlacement',
  'collisionOverlay'
];

function readArg(name, fallback = '') {
  const prefix = `${name}=`;
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function readFlag(name) {
  return process.argv.includes(name);
}

function readListArg(name) {
  return readArg(name, '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function runAdb(args, adbPath = DEFAULT_ADB) {
  const result = spawnSync(adbPath, args, {
    encoding: 'utf8',
    windowsHide: true
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `adb failed: ${args.join(' ')}`).trim());
  }
  return result.stdout || '';
}

function findWebViewSocket(adbPath) {
  const unixSockets = runAdb(['shell', 'cat', '/proc/net/unix'], adbPath);
  const matches = [...unixSockets.matchAll(/@(webview_devtools_remote_[^\s]+|chrome_devtools_remote[^\s]*)/g)]
    .map((match) => match[1]);
  if (matches.length === 0) {
    throw new Error('No WebView DevTools socket found. Make sure the Android app is open and WebView debugging is enabled.');
  }
  return matches[0];
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error(`Invalid JSON from ${url}: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
}

function encodeWebSocketFrame(payload) {
  const body = Buffer.from(payload);
  const header = [];
  header.push(0x81);
  if (body.length < 126) {
    header.push(0x80 | body.length);
  } else if (body.length < 65536) {
    header.push(0x80 | 126, (body.length >> 8) & 0xff, body.length & 0xff);
  } else {
    header.push(0x80 | 127, 0, 0, 0, 0, (body.length / 2 ** 24) & 0xff, (body.length / 2 ** 16) & 0xff, (body.length / 2 ** 8) & 0xff, body.length & 0xff);
  }
  const mask = crypto.randomBytes(4);
  const masked = Buffer.alloc(body.length);
  for (let index = 0; index < body.length; index += 1) {
    masked[index] = body[index] ^ mask[index % 4];
  }
  return Buffer.concat([Buffer.from(header), mask, masked]);
}

function decodeWebSocketFrames(buffer) {
  const frames = [];
  let offset = 0;
  while (buffer.length - offset >= 2) {
    const first = buffer[offset];
    const second = buffer[offset + 1];
    let length = second & 0x7f;
    let headerLength = 2;
    if (length === 126) {
      if (buffer.length - offset < 4) break;
      length = buffer.readUInt16BE(offset + 2);
      headerLength = 4;
    } else if (length === 127) {
      if (buffer.length - offset < 10) break;
      const high = buffer.readUInt32BE(offset + 2);
      const low = buffer.readUInt32BE(offset + 6);
      length = high * 2 ** 32 + low;
      headerLength = 10;
    }
    const masked = (second & 0x80) !== 0;
    const maskLength = masked ? 4 : 0;
    const frameLength = headerLength + maskLength + length;
    if (buffer.length - offset < frameLength) break;

    const mask = masked ? buffer.subarray(offset + headerLength, offset + headerLength + 4) : null;
    const payloadStart = offset + headerLength + maskLength;
    const payload = Buffer.from(buffer.subarray(payloadStart, payloadStart + length));
    if (mask) {
      for (let index = 0; index < payload.length; index += 1) {
        payload[index] ^= mask[index % 4];
      }
    }
    if ((first & 0x0f) === 1) frames.push(payload.toString('utf8'));
    offset += frameLength;
  }
  return {
    frames,
    rest: buffer.subarray(offset)
  };
}

function connectCdp(webSocketDebuggerUrl) {
  const parsed = new URL(webSocketDebuggerUrl);
  const socket = net.createConnection({
    host: parsed.hostname,
    port: Number(parsed.port)
  });
  const key = crypto.randomBytes(16).toString('base64');
  let buffer = Buffer.alloc(0);
  let connected = false;
  let nextId = 0;
  const pending = new Map();

  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    if (!connected) return;
    const decoded = decodeWebSocketFrames(buffer);
    buffer = decoded.rest;
    decoded.frames.forEach((frame) => {
      const message = JSON.parse(frame);
      if (message.id && pending.has(message.id)) {
        pending.get(message.id)(message);
        pending.delete(message.id);
      }
    });
  });

  return new Promise((resolve, reject) => {
    socket.once('error', reject);
    socket.once('connect', () => {
      socket.write([
        `GET ${parsed.pathname}${parsed.search} HTTP/1.1`,
        `Host: ${parsed.host}`,
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Key: ${key}`,
        'Sec-WebSocket-Version: 13',
        '',
        ''
      ].join('\r\n'));
    });

    const checkHandshake = () => {
      const text = buffer.toString('utf8');
      const headerEnd = text.indexOf('\r\n\r\n');
      if (headerEnd < 0) {
        setTimeout(checkHandshake, 10);
        return;
      }
      if (!text.startsWith('HTTP/1.1 101')) {
        reject(new Error(`WebSocket handshake failed: ${text.slice(0, headerEnd)}`));
        socket.destroy();
        return;
      }
      buffer = buffer.subarray(headerEnd + 4);
      connected = true;
      resolve({
        send(method, params = {}) {
          const id = ++nextId;
          socket.write(encodeWebSocketFrame(JSON.stringify({ id, method, params })));
          return new Promise((sendResolve) => pending.set(id, sendResolve));
        },
        close() {
          socket.end();
        }
      });
    };
    setTimeout(checkHandshake, 10);
  });
}

function getBypassPatch() {
  const bypassNames = readListArg('--bypass');
  const unbypassNames = readListArg('--unbypass');
  const onlyNames = readListArg('--only');
  if (onlyNames.length > 0) {
    return Object.fromEntries(LAYOUT_PIPELINE_STEPS.map((step) => [step, !onlyNames.includes(step)]));
  }
  if (unbypassNames.length > 0) {
    return Object.fromEntries(unbypassNames.map((step) => [step, false]));
  }
  if (bypassNames.length > 0) {
    return Object.fromEntries(bypassNames.map((step) => [step, true]));
  }
  return null;
}

function buildInspectionExpression(target, bypassPatch, clearBypasses) {
  return `(() => {
    const target = ${JSON.stringify(target)};
    const api = window.__sharpElevenChartDebug;
    const layoutApi = window.__sharpElevenChartLayoutDebug;
    const bypassPatch = ${JSON.stringify(bypassPatch)};
    const shouldClearBypasses = ${JSON.stringify(clearBypasses)};
    if (shouldClearBypasses) layoutApi?.clearBypasses?.();
    if (bypassPatch) layoutApi?.setBypasses?.(bypassPatch);
    if (api?.inspectBar || layoutApi?.inspectBar) {
      const inspector = layoutApi?.inspectBar ? layoutApi : api;
      return {
        source: 'sharpElevenDebugApi',
        activeBypasses: layoutApi?.getBypasses?.() || null,
        snapshot: inspector.snapshot?.(),
        inspection: inspector.inspectBar(target)
      };
    }
    return {
      source: 'missingDebugApi',
      title: document.title,
      href: location.href,
      message: 'window.__sharpElevenChartDebug is not installed in this WebView.'
    };
  })()`;
}

async function main() {
  const adbPath = readArg('--adb', DEFAULT_ADB);
  const port = Number(readArg('--port', String(DEFAULT_PORT)));
  const barArg = readArg('--bar', '');
  const rowArg = readArg('--row', '');
  const columnArg = readArg('--column', '');
  const bypassPatch = getBypassPatch();
  const clearBypasses = readFlag('--clear-bypasses');
  const target = rowArg && columnArg
    ? { row: Number(rowArg), column: Number(columnArg) }
    : Number(barArg || process.argv[2] || 8);

  const socketName = findWebViewSocket(adbPath);
  runAdb(['forward', `tcp:${port}`, `localabstract:${socketName}`], adbPath);
  const targets = await fetchJson(`http://127.0.0.1:${port}/json`);
  const page = targets.find((targetPage) => targetPage.type === 'page' && targetPage.webSocketDebuggerUrl) || targets[0];
  if (!page?.webSocketDebuggerUrl) throw new Error('No debuggable WebView page found.');

  const cdp = await connectCdp(page.webSocketDebuggerUrl);
  await cdp.send('Runtime.enable');
  const evaluated = await cdp.send('Runtime.evaluate', {
    expression: buildInspectionExpression(target, bypassPatch, clearBypasses),
    returnByValue: true,
    awaitPromise: true
  });
  cdp.close();

  const value = evaluated.result?.value ?? evaluated.result?.result?.value ?? evaluated;
  await fs.mkdir('.codex-live-reload-logs', { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(value, null, 2));

  if (readFlag('--json')) {
    console.log(JSON.stringify(value, null, 2));
    return;
  }

  const inspection = value.inspection || {};
  const chart = inspection.chart || value.snapshot?.chart || {};
  const layout = inspection.layout || {};
  console.log(`Chart: ${chart.title || page.title || '(unknown)'}`);
  console.log(`Target: ${JSON.stringify(target)} | WebView: ${page.url}`);
  if (value.activeBypasses) console.log(`Bypasses: ${JSON.stringify(value.activeBypasses)}`);
  console.log(`Output: ${OUTPUT_PATH}`);
  if (layout) {
    console.log(`Bar ${layout.barIndex ?? '?'} row ${layout.rowIndex ?? '?'} col ${layout.columnIndex ?? '?'}`);
    console.log(`Scales local=${layout.localScale} row=${layout.rowScale} page=${layout.pageScale} final=${layout.finalScale}`);
    console.log(`Limits row=${layout.rowScaleLimit} page=${layout.pageScaleLimit}`);
    console.table((layout.tokens || []).map((token) => ({
      slot: token.slotIndex,
      symbol: token.symbol,
      offsetPx: Number(token.offsetPx || 0).toFixed(2),
      anchorDeltaPx: Number(token.anchorDeltaPx || 0).toFixed(2),
      overlapNextPx: Number(token.overlapWithNextPx || 0).toFixed(2),
      tokenScaleX: token.tokenScaleX,
      rootScaleX: token.rootScaleX
    })));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
