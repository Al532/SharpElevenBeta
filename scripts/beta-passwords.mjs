import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash, randomInt } from 'node:crypto';
import { resolve } from 'node:path';

const storePath = resolve(process.cwd(), '.beta-passwords.json');
const localEnvPath = resolve(process.cwd(), '.env.local');
const defaultDigits = 6;
const defaultCount = 15;

function nowIso() {
  return new Date().toISOString();
}

function sha256Hex(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function parseArgs(argv) {
  const args = [];
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) {
      args.push(value);
      continue;
    }

    const [name, inlineValue] = value.slice(2).split('=', 2);
    if (inlineValue !== undefined) {
      options[name] = inlineValue;
    } else if (argv[index + 1] && !argv[index + 1].startsWith('--')) {
      options[name] = argv[index + 1];
      index += 1;
    } else {
      options[name] = true;
    }
  }

  return { args, options };
}

function readStore() {
  if (!existsSync(storePath)) {
    throw new Error(`Missing ${storePath}. Run: npm run beta:passwords -- init`);
  }

  return JSON.parse(readFileSync(storePath, 'utf8'));
}

function writeStore(store) {
  store.updatedAt = nowIso();
  writeFileSync(storePath, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}

function createStore({ count, digits }) {
  const store = {
    version: 1,
    digits,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    entries: [],
  };

  for (let index = 1; index <= count; index += 1) {
    addEntry(store, {
      label: formatInviteLabel(index),
      password: generatePassword(store),
    });
  }

  return store;
}

function formatInviteLabel(index) {
  return `invite-${String(index).padStart(2, '0')}`;
}

function parsePositiveInteger(value, fallback) {
  if (value === undefined || value === true) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`Invalid positive integer: ${value}`);
  return parsed;
}

function generatePassword(store) {
  const digits = store.digits || defaultDigits;
  const limit = 10 ** digits;
  const existing = new Set(store.entries.map((entry) => entry.password));

  for (let attempt = 0; attempt < 10000; attempt += 1) {
    const password = String(randomInt(0, limit)).padStart(digits, '0');
    if (!existing.has(password)) return password;
  }

  throw new Error('Could not generate a unique password.');
}

function validatePassword(store, password) {
  const digits = store.digits || defaultDigits;
  if (!new RegExp(`^\\d{${digits}}$`).test(password)) {
    throw new Error(`Password must be exactly ${digits} digits.`);
  }
}

function nextInviteLabel(store) {
  const used = new Set(store.entries.map((entry) => entry.label));
  for (let index = 1; index < 10000; index += 1) {
    const label = formatInviteLabel(index);
    if (!used.has(label)) return label;
  }
  throw new Error('Could not find a free invite label.');
}

function addEntry(store, { label, password }) {
  if (!label || !/^[a-zA-Z0-9_.-]+$/.test(label)) {
    throw new Error('Label must contain only letters, digits, dots, underscores, or hyphens.');
  }
  if (store.entries.some((entry) => entry.label === label)) {
    throw new Error(`Label already exists: ${label}`);
  }

  validatePassword(store, password);
  if (store.entries.some((entry) => entry.password === password)) {
    throw new Error(`Password already exists: ${password}`);
  }

  store.entries.push({
    label,
    password,
    hash: sha256Hex(password),
    active: true,
    createdAt: nowIso(),
  });
}

function findEntry(store, target) {
  return store.entries.find((entry) => entry.label === target || entry.password === target);
}

function findAssignedEntry(store, recipient) {
  const normalizedRecipient = recipient.trim().toLocaleLowerCase();
  return store.entries.find((entry) => (
    entry.active
    && entry.assignedTo
    && entry.assignedTo.trim().toLocaleLowerCase() === normalizedRecipient
  ));
}

function findNextUnassignedEntry(store) {
  return store.entries.find((entry) => entry.active && !entry.assignedTo);
}

function exportSecretValue(store) {
  return store.entries
    .filter((entry) => entry.active)
    .map((entry) => `${entry.label}:${entry.hash}`)
    .join(',');
}

function readProjectRef() {
  if (process.env.SUPABASE_PROJECT_REF) return process.env.SUPABASE_PROJECT_REF;
  if (!existsSync(localEnvPath)) return '';

  const env = readFileSync(localEnvPath, 'utf8');
  const match = /^VITE_SUPABASE_URL=(https:\/\/([a-z0-9-]+)\.supabase\.co)/m.exec(env);
  return match?.[2] || '';
}

function printList(store, { all = false } = {}) {
  const entries = all ? store.entries : store.entries.filter((entry) => entry.active);
  if (entries.length === 0) {
    console.log(all ? 'No beta passwords.' : 'No active beta passwords.');
    return;
  }

  const rows = entries.map((entry) => ({
    label: entry.label.padEnd(10),
    password: entry.password,
    status: (entry.active ? 'active' : 'revoked').padEnd(7),
    assignedTo: entry.assignedTo || '-',
  }));

  console.log('Label      Password  Status   Assigned to');
  console.log('---------- --------  -------  -----------');
  for (const row of rows) {
    console.log(`${row.label} ${row.password}  ${row.status}  ${row.assignedTo}`);
  }
}

function printHelp() {
  console.log(`Beta password manager

Usage:
  npm run beta:passwords -- init [--count 15] [--digits 6] [--force]
  npm run beta:passwords -- list [--all]
  npm run beta:passwords -- add [label] [--password 123456]
  npm run beta:passwords -- issue <name>
  npm run beta:passwords -- unassign <label-or-password-or-name>
  npm run beta:passwords -- revoke <label-or-password>
  npm run beta:passwords -- restore <label-or-password>
  npm run beta:passwords -- export [--raw]
  npm run beta:passwords -- push

The local store is ${storePath}`);
}

function commandInit(options) {
  if (existsSync(storePath) && !options.force) {
    throw new Error(`${storePath} already exists. Use --force to replace it.`);
  }

  const count = parsePositiveInteger(options.count, defaultCount);
  const digits = parsePositiveInteger(options.digits, defaultDigits);
  const store = createStore({ count, digits });
  writeStore(store);
  console.log(`Created ${storePath} with ${count} active ${digits}-digit passwords.`);
  printList(store);
}

function commandAdd(args, options) {
  const store = readStore();
  const label = args[0] || nextInviteLabel(store);
  const password = options.password ? String(options.password) : generatePassword(store);
  addEntry(store, { label, password });
  writeStore(store);
  const entry = findEntry(store, label);
  console.log(`Added ${entry.label}: ${entry.password}`);
}

function commandIssue(args) {
  const recipient = args.join(' ').trim();
  if (!recipient) throw new Error('Missing recipient name.');

  const store = readStore();
  const existingEntry = findAssignedEntry(store, recipient);
  if (existingEntry) {
    console.log(`${recipient} already has ${existingEntry.label}.`);
    console.log(`Password to give: ${existingEntry.password}`);
    return;
  }

  const entry = findNextUnassignedEntry(store);
  if (!entry) {
    throw new Error('No active unassigned password left. Run: npm run beta:passwords -- add');
  }

  entry.assignedTo = recipient;
  entry.assignedAt = nowIso();
  writeStore(store);

  console.log(`Assigned ${entry.label} to ${recipient}.`);
  console.log(`Password to give: ${entry.password}`);
}

function commandUnassign(args) {
  const target = args.join(' ').trim();
  if (!target) throw new Error('Missing label, password, or recipient name to unassign.');

  const store = readStore();
  const entry = findEntry(store, target) || findAssignedEntry(store, target);
  if (!entry) throw new Error(`No assignment found for: ${target}`);
  if (!entry.assignedTo) {
    console.log(`${entry.label} is not assigned.`);
    return;
  }

  const previousRecipient = entry.assignedTo;
  delete entry.assignedTo;
  delete entry.assignedAt;
  writeStore(store);
  console.log(`Unassigned ${entry.label} from ${previousRecipient}.`);
}

function commandRevoke(args) {
  const target = args[0];
  if (!target) throw new Error('Missing label or password to revoke.');

  const store = readStore();
  const entry = findEntry(store, target);
  if (!entry) throw new Error(`No password found for: ${target}`);
  if (!entry.active) {
    console.log(`${entry.label} is already revoked.`);
    return;
  }

  entry.active = false;
  entry.revokedAt = nowIso();
  writeStore(store);
  const suffix = entry.assignedTo ? ` assigned to ${entry.assignedTo}` : '';
  console.log(`Revoked ${entry.label} (${entry.password})${suffix}.`);
}

function commandRestore(args) {
  const target = args[0];
  if (!target) throw new Error('Missing label or password to restore.');

  const store = readStore();
  const entry = findEntry(store, target);
  if (!entry) throw new Error(`No password found for: ${target}`);
  if (entry.active) {
    console.log(`${entry.label} is already active.`);
    return;
  }

  entry.active = true;
  delete entry.revokedAt;
  writeStore(store);
  console.log(`Restored ${entry.label} (${entry.password}).`);
}

function commandExport(options) {
  const store = readStore();
  const value = exportSecretValue(store);

  if (options.raw) {
    console.log(value);
    return;
  }

  console.log(`Active passwords: ${store.entries.filter((entry) => entry.active).length}`);
  console.log('');
  console.log('BETA_ACCESS_PASSWORD_HASHES=');
  console.log(value);
}

function commandPush(options) {
  const store = readStore();
  const value = exportSecretValue(store);
  if (!value) throw new Error('No active passwords to push.');
  const projectRef = options['project-ref'] || readProjectRef();

  const args = ['supabase', 'secrets', 'set', `BETA_ACCESS_PASSWORD_HASHES=${value}`];
  if (projectRef) args.push('--project-ref', projectRef);

  const result = spawnSync('npx', args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error('supabase secrets set failed. Run npx supabase login, then try again.');
  }
}

function main() {
  const { args, options } = parseArgs(process.argv.slice(2));
  const command = args.shift() || 'help';

  switch (command) {
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    case 'init':
      commandInit(options);
      break;
    case 'list':
      printList(readStore(), { all: Boolean(options.all) });
      break;
    case 'add':
      commandAdd(args, options);
      break;
    case 'issue':
      commandIssue(args);
      break;
    case 'unassign':
      commandUnassign(args);
      break;
    case 'revoke':
      commandRevoke(args);
      break;
    case 'restore':
      commandRestore(args);
      break;
    case 'export':
      commandExport(options);
      break;
    case 'push':
      commandPush(options);
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
