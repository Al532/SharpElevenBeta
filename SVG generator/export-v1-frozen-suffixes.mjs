import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderChordSymbolHtml } from '../src/core/music/chord-symbol-display.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT_DIR = path.join(ROOT, 'SVG generator');
const OUTPUT_DIR = path.join(SCRIPT_DIR, 'v1-frozen-output');
const PROBE_PATH = path.join(OUTPUT_DIR, 'v1-frozen-probe.html');
const RUNTIME_PATH = path.join(OUTPUT_DIR, 'v1-frozen-suffix-runtime.json');
const PREVIEW_PATH = path.join(OUTPUT_DIR, 'preview.html');
const CSS_PATH = path.join(ROOT, 'public', 'chord-symbol.css');
const DEFAULT_ROOT = 'C';
const DEFAULT_FONT_SIZE = 64;

const DEFAULT_SUFFIXES = Object.freeze([
  'm',
  'm7',
  'maj',
  'maj7',
  'sus',
  '7sus',
  'dim',
  'dim7',
  '69'
]);

const CHROME_CANDIDATES = Object.freeze([
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
]);

async function main() {
  const suffixes = parseSuffixes(process.argv.slice(2));
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const css = await fs.readFile(CSS_PATH, 'utf8');
  await fs.writeFile(PROBE_PATH, createProbeHtml(suffixes), 'utf8');

  const browser = await launchBrowser();
  try {
    const client = await connectToFirstPage(browser.port);
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Page.navigate', { url: pathToFileURL(PROBE_PATH).href });
    await client.waitFor('Page.loadEventFired');

    const measured = await client.evaluate(measureProbeInPage);
    const blocks = measured.map((block) => createFrozenBlock(block));
    const payload = {
      version: 1,
      renderer: 'v1-dom-foreign-object',
      description: 'Experimental suffix blocks frozen from renderer V1 browser layout.',
      sourceRoot: DEFAULT_ROOT,
      fontSizePx: DEFAULT_FONT_SIZE,
      blockCount: blocks.length,
      blocks
    };

    await fs.writeFile(RUNTIME_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    await Promise.all(blocks.map((block) => writeStandaloneSvg(block, css)));
    await fs.writeFile(PREVIEW_PATH, createPreviewHtml(blocks), 'utf8');

    console.log(`Wrote ${path.relative(ROOT, RUNTIME_PATH)} (${blocks.length} blocks).`);
    console.log(`Wrote ${path.relative(ROOT, PREVIEW_PATH)}.`);
  } finally {
    await browser.close();
  }
}

function parseSuffixes(args) {
  const explicit = args.flatMap((arg) => {
    if (arg === '--help' || arg === '-h') {
      console.log('Usage: node --import ./scripts/register-ts-source-loader.mjs "SVG generator/export-v1-frozen-suffixes.mjs" [suffix ...]');
      process.exit(0);
    }
    if (arg.startsWith('--suffixes=')) {
      return arg.slice('--suffixes='.length).split(',');
    }
    return arg.startsWith('--') ? [] : [arg];
  }).map((value) => value.trim()).filter(Boolean);

  return explicit.length ? explicit : [...DEFAULT_SUFFIXES];
}

function createProbeHtml(suffixes) {
  const rows = suffixes.map((suffix) => {
    const chordHtml = renderChordSymbolHtml(DEFAULT_ROOT, suffix);
    return [
      `<section class="probe-row" data-suffix="${escapeAttr(suffix)}">`,
      `<div class="probe-label">${escapeHtml(suffix)}</div>`,
      `<div class="probe-chord" data-suffix="${escapeAttr(suffix)}">${chordHtml}</div>`,
      '</section>'
    ].join('');
  }).join('\n');

  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    '<link rel="stylesheet" href="../../public/chord-symbol.css">',
    '<style>',
    'body { margin: 0; padding: 24px; background: white; color: #111; }',
    `.probe-row { display: flex; align-items: baseline; gap: 24px; min-height: ${DEFAULT_FONT_SIZE * 1.9}px; }`,
    '.probe-label { width: 80px; font: 14px/1.2 sans-serif; color: #666; }',
    `.probe-chord { font-size: ${DEFAULT_FONT_SIZE}px; line-height: 1; }`,
    '</style>',
    '</head>',
    '<body>',
    rows,
    '</body>',
    '</html>'
  ].join('\n');
}

function measureProbeInPage() {
  const round = (value, precision = 3) => Number(value.toFixed(precision));
  const unionRects = (rects) => {
    const valid = rects.filter(Boolean);
    if (!valid.length) return null;
    const left = Math.min(...valid.map((rect) => rect.left));
    const top = Math.min(...valid.map((rect) => rect.top));
    const right = Math.max(...valid.map((rect) => rect.right));
    const bottom = Math.max(...valid.map((rect) => rect.bottom));
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  };
  const rectJson = (rect) => ({
    left: round(rect.left),
    top: round(rect.top),
    right: round(rect.right),
    bottom: round(rect.bottom),
    width: round(rect.width),
    height: round(rect.height)
  });
  const suffixes = [];

  for (const row of document.querySelectorAll('.probe-row')) {
    const chordHost = row.querySelector('.probe-chord');
    const symbol = chordHost?.querySelector('.chord-symbol');
    const root = symbol?.querySelector('.chord-symbol-root');
    if (!chordHost || !symbol || !root) continue;

    const rootRect = root.getBoundingClientRect();
    const symbolRect = symbol.getBoundingClientRect();
    const suffixRoots = [
      symbol.querySelector('.chord-symbol-base'),
      symbol.querySelector('.chord-symbol-sup')
    ].filter(Boolean);
    const suffixNodes = suffixRoots.flatMap((node) => [node, ...node.querySelectorAll('*')]);
    const suffixRect = unionRects(
      suffixNodes
        .map((node) => node.getBoundingClientRect())
        .filter((rect) => rect.width > 0 && rect.height > 0)
    );
    if (!suffixRect) continue;

    const originX = rootRect.right - symbolRect.left;
    const originY = suffixRect.top - symbolRect.top;
    const width = Math.ceil(suffixRect.right - rootRect.right + 4);
    const height = Math.ceil(suffixRect.height + 4);

    suffixes.push({
      suffix: row.getAttribute('data-suffix') || '',
      chordHtml: symbol.outerHTML,
      metrics: {
        symbolRect: rectJson(symbolRect),
        rootRect: rectJson(rootRect),
        suffixRect: rectJson(suffixRect),
        originX: round(originX),
        originY: round(originY),
        width: Math.max(1, width),
        height: Math.max(1, height),
        viewBox: {
          x: 0,
          y: 0,
          width: Math.max(1, width),
          height: Math.max(1, height)
        },
        foreignObject: {
          x: round(-originX),
          y: round(-originY),
          width: round(symbolRect.width + originX + 8),
          height: round(symbolRect.height + originY + 8)
        }
      }
    });
  }

  return suffixes;
}

function createFrozenBlock(measured) {
  const id = toBlockId(measured.suffix);
  const html = measured.chordHtml
    .replaceAll(' xmlns="http://www.w3.org/1999/xhtml"', '');
  const { foreignObject } = measured.metrics;
  const { width, height } = measured.metrics.viewBox;
  const svgFragment = [
    `<svg class="v1-frozen-suffix-svg" x="0" y="0" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" overflow="hidden">`,
    `<foreignObject x="${foreignObject.x}" y="${foreignObject.y}" width="${foreignObject.width}" height="${foreignObject.height}">`,
    `<div xmlns="http://www.w3.org/1999/xhtml" class="v1-frozen-html" style="font-size:${DEFAULT_FONT_SIZE}px;line-height:1;color:currentColor">`,
    html,
    '</div>',
    '</foreignObject>',
    '</svg>'
  ].join('');

  return {
    id,
    label: measured.suffix,
    suffix: measured.suffix,
    sourceChord: `${DEFAULT_ROOT}${measured.suffix}`,
    metrics: measured.metrics,
    svgFragment
  };
}

async function writeStandaloneSvg(block, css) {
  const filePath = path.join(OUTPUT_DIR, `${block.id}.svg`);
  const { width, height } = block.metrics.viewBox;
  const standaloneCss = css.replaceAll('url("./assets/fonts/', 'url("../../public/assets/fonts/');
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" color="black">`,
    '<style><![CDATA[',
    standaloneCss,
    '.v1-frozen-html { display: inline-block; }',
    ']]></style>',
    block.svgFragment,
    '</svg>'
  ].join('\n');
  await fs.writeFile(filePath, svg, 'utf8');
}

function createPreviewHtml(blocks) {
  const rows = blocks.map((block) => {
    const original = renderChordSymbolHtml(DEFAULT_ROOT, block.suffix);
    const { width, height } = block.metrics.viewBox;
    return [
      `<section class="preview-row">`,
      `<div class="preview-label">${escapeHtml(block.suffix)}</div>`,
      `<div class="preview-original">${original}</div>`,
      `<svg class="preview-frozen" viewBox="0 0 ${width} ${height}" style="width:${width}px;height:${height}px">`,
      block.svgFragment,
      '</svg>',
      `<a href="./${block.id}.svg">${escapeHtml(block.id)}.svg</a>`,
      '</section>'
    ].join('');
  }).join('\n');

  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    '<link rel="stylesheet" href="../../public/chord-symbol.css">',
    '<style>',
    'body { margin: 0; padding: 28px; color: #111; background: #fff; font: 14px/1.35 system-ui, sans-serif; }',
    'h1 { font-size: 18px; margin: 0 0 18px; font-weight: 650; }',
    '.preview-row { display: grid; grid-template-columns: 80px 180px 180px 1fr; align-items: baseline; gap: 18px; min-height: 90px; border-bottom: 1px solid #eee; }',
    '.preview-label { color: #666; }',
    `.preview-original, .v1-frozen-html { font-size: ${DEFAULT_FONT_SIZE}px; line-height: 1; }`,
    '.preview-frozen { overflow: hidden; color: currentColor; vertical-align: baseline; background: #fafafa; }',
    'a { color: #425a78; text-decoration: none; }',
    '</style>',
    '</head>',
    '<body>',
    '<h1>Renderer V1 suffixes frozen into SVG foreignObject blocks</h1>',
    rows,
    '</body>',
    '</html>'
  ].join('\n');
}

function toBlockId(value) {
  const normalized = String(value || '')
    .replaceAll('\u266D', 'b')
    .replaceAll('\u266F', 'sharp')
    .replaceAll('△', 'triangle')
    .replaceAll('ø', 'half-diminished')
    .replaceAll('°', 'dim');
  return `v1-${normalized.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'plain'}`;
}

async function launchBrowser() {
  const executablePath = await findChrome();
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sharp-eleven-v1-freeze-'));
  const port = 9300 + Math.floor(Math.random() * 500);
  const child = spawn(executablePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  child.stdout.on('data', () => {});
  child.stderr.on('data', () => {});
  await waitForDevTools(port);

  return {
    port,
    async close() {
      child.kill();
      await waitForProcessExit(child, 3_000);
      await removeTempDir(userDataDir);
    }
  };
}

async function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // keep looking
    }
  }
  throw new Error('No Chrome or Edge executable found for V1 layout capture.');
}

async function waitForDevTools(port) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      await fetchJson(`http://127.0.0.1:${port}/json/version`);
      return;
    } catch {
      await delay(100);
    }
  }
  throw new Error(`Timed out waiting for Chrome DevTools on port ${port}.`);
}

async function connectToFirstPage(port) {
  const pages = await fetchJson(`http://127.0.0.1:${port}/json/list`);
  const page = pages.find((entry) => entry.type === 'page' && entry.webSocketDebuggerUrl);
  if (!page) throw new Error('No debuggable Chrome page found.');
  return new CdpClient(page.webSocketDebuggerUrl);
}

class CdpClient {
  constructor(url) {
    this.nextId = 1;
    this.pending = new Map();
    this.waiters = new Map();
    this.socket = new WebSocket(url);
    this.opened = new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', reject, { once: true });
    });
    this.socket.addEventListener('message', (event) => this.handleMessage(event));
  }

  async send(method, params = {}) {
    await this.opened;
    const id = this.nextId++;
    const message = { id, method, params };
    const response = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.socket.send(JSON.stringify(message));
    return response;
  }

  async evaluate(fn) {
    const response = await this.send('Runtime.evaluate', {
      expression: `(${fn.toString()})()`,
      awaitPromise: true,
      returnByValue: true
    });
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.text || 'Runtime evaluation failed.');
    }
    return response.result.value;
  }

  async waitFor(method) {
    return new Promise((resolve) => {
      const waiters = this.waiters.get(method) || [];
      waiters.push(resolve);
      this.waiters.set(method, waiters);
    });
  }

  handleMessage(event) {
    const message = JSON.parse(event.data);
    if (message.id && this.pending.has(message.id)) {
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result || {});
      return;
    }
    if (message.method && this.waiters.has(message.method)) {
      const waiters = this.waiters.get(message.method);
      this.waiters.delete(message.method);
      waiters.forEach((resolve) => resolve(message.params || {}));
    }
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForProcessExit(child, timeoutMs) {
  if (child.exitCode !== null || child.killed) {
    return delay(250);
  }

  return new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function removeTempDir(dir) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
      return;
    } catch (error) {
      if (error?.code !== 'EBUSY' && error?.code !== 'ENOTEMPTY') throw error;
      await delay(250 * (attempt + 1));
    }
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('`', '&#96;');
}

await main();
