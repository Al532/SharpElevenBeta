import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';

const FORUM_BASE_URL = 'https://forums.irealpro.com';

const SECTIONS = [
  { name: 'Jazz', url: `${FORUM_BASE_URL}/forums/jazz.6/` },
  { name: 'Brazilian & Latin', url: `${FORUM_BASE_URL}/forums/brazilian-latin.17/` },
  { name: 'Pop/Rock/Blues/Indie', url: `${FORUM_BASE_URL}/forums/pop-rock-blues-indie.7/` },
  { name: 'Country/Folk/Bluegrass', url: `${FORUM_BASE_URL}/forums/country-folk-bluegrass.12/` },
  { name: 'Holiday/Film/Worship/Classical/World/Other', url: `${FORUM_BASE_URL}/forums/holiday-film-worship-classical-world-other.13/` },
  { name: 'Sandbox', url: `${FORUM_BASE_URL}/forums/sandbox.26/` }
];

const OUTPUT_DIR = path.join(process.cwd(), 'parsing-projects', 'ireal', 'forum-archive');
const LINKS_PATH = path.join(OUTPUT_DIR, 'links.jsonl');
const THREADS_PATH = path.join(OUTPUT_DIR, 'threads.jsonl');
const STATE_PATH = path.join(OUTPUT_DIR, 'crawl-state.json');

const DEFAULT_CONFIG = {
  delayMs: 950,
  retryLimit: 3,
  retryBaseDelayMs: 800
};

function parseArgs(rawArgs) {
  const options = {
    limitPages: null,
    limitThreads: null,
    sections: null,
    delayMs: DEFAULT_CONFIG.delayMs,
    retryLimit: DEFAULT_CONFIG.retryLimit,
    requestTimeoutMs: 20000,
    help: false
  };

  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i];
    const next = () => rawArgs[++i];

    if (arg === '--limit-pages') {
      const value = Number(next());
      if (Number.isInteger(value) && value > 0) options.limitPages = value;
    } else if (arg === '--limit-threads') {
      const value = Number(next());
      if (Number.isInteger(value) && value > 0) options.limitThreads = value;
    } else if (arg === '--delay-ms') {
      const value = Number(next());
      if (Number.isInteger(value) && value >= 0) options.delayMs = value;
    } else if (arg === '--retry-limit') {
      const value = Number(next());
      if (Number.isInteger(value) && value >= 0) options.retryLimit = value;
    } else if (arg === '--sections') {
      const raw = String(next() || '');
      options.sections = raw
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage:
node scripts/archive-ireal-forum-links.mjs [--limit-pages N] [--limit-threads N] [--sections "Jazz,Sandbox"] [--delay-ms 1000] [--retry-limit 3]

Options:
  --limit-pages N      Max pages crawled per section (for a soft test).
  --limit-threads N    Max threads crawled overall (for a soft test).
  --sections CSV       Optional comma-separated section names.
  --delay-ms N         Delay in ms between requests (default: ${DEFAULT_CONFIG.delayMs}).
  --retry-limit N      Max retry count for failed requests (default: ${DEFAULT_CONFIG.retryLimit}).`);
}

function normalizeSectionSelection(inputSections) {
  if (!inputSections?.length) return null;
  const normalized = new Set(inputSections.map((value) => value.toLowerCase()));
  const selection = SECTIONS.filter((section) => normalized.has(section.name.toLowerCase()));
  return selection.length ? selection : [];
}

function safeJoin(base, segment) {
  return `${String(base).replace(/\/+$/, '')}/${segment.replace(/^\/+/, '')}`;
}

function makeSectionUrl(section, pageNumber) {
  if (pageNumber <= 1) return section.url;
  return safeJoin(section.url, `page-${pageNumber}/`);
}

function buildCanonicalThreadUrl(urlString) {
  const parsed = new URL(urlString, FORUM_BASE_URL);
  parsed.hash = '';
  parsed.search = '';
  return parsed.href;
}

function canonicalPostUrl(threadUrl, postId) {
  return postId ? safeJoin(threadUrl, `post-${postId}`) : threadUrl;
}

function stripTags(text) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|li|div|h[1-6]|tr|table|blockquote)>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeMinimalHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&#x60;/g, '`');
}

function trimLinkBoundary(value) {
  return String(value).replace(/[)\].,!?;:>]+$/u, '');
}

function extractThreadTitle(html) {
  const titleMatch = html.match(/<h1[^>]*class="[^"]*p-title-value[^"]*"[^>]*>(.*?)<\/h1>/i);
  if (titleMatch?.[1]) return decodeMinimalHtml(titleMatch[1]).replace(/\s+/g, ' ').trim();

  const fallback = html.match(/<title>(.*?)<\/title>/i);
  return fallback?.[1] ? decodeMinimalHtml(fallback[1]).replace(/\s+/, ' ').trim() : '';
}

function extractListingThreadUrls(sectionUrl, listingHtml) {
  const hrefRegex = /href="([^"]*?)"/gi;
  const threads = [];
  let match;

  while ((match = hrefRegex.exec(listingHtml))) {
    const href = match[1];
    if (!href || !href.includes('/threads/')) continue;
    if (!/\/threads\/[^/"']+?\.\d+\/?$/.test(href)) continue;

    const absolute = buildCanonicalThreadUrl(new URL(href, FORUM_BASE_URL));
    if (!threads.includes(absolute)) {
      threads.push(absolute);
    }
  }

  return threads;
}

function extractLinksFromPostHtml(postHtml) {
  const links = [];
  const seen = new Set();
  const anchorRegex = /<a\b[^>]*\bhref\s*=\s*(['"])([^'"]+)\1[^>]*>(.*?)<\/a>/gis;

  let match;
  while ((match = anchorRegex.exec(postHtml))) {
    const href = decodeMinimalHtml(match[2]);
    if (!/(?:^|[^\w])(irealb:\/\/|irealbook:\/\/)/i.test(href)) continue;
    const linkText = decodeMinimalHtml(match[3]).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const raw = trimLinkBoundary(href);
    if (!/^ireal(?:b|book):\/\//i.test(raw) || seen.has(raw)) continue;
    const anchorWindow = postHtml.slice(Math.max(0, match.index - 160), Math.min(postHtml.length, match.index + match[0].length + 160));
    const anchorContext = decodeMinimalHtml(stripTags(anchorWindow)).replace(/\s+/g, ' ').trim();
    seen.add(raw);
    links.push({ raw_link: raw, link_text: linkText || raw, match_source: 'href', context_hint: anchorContext });
  }

  const plainText = stripTags(postHtml);
  const decodedPlain = decodeMinimalHtml(plainText);
  const plainRegex = /(ireal(?:b|book):\/\/[^\s"'<>`[\]{}()]+)/gi;
  while ((match = plainRegex.exec(decodedPlain))) {
    const raw = trimLinkBoundary(match[1]);
    if (!raw || seen.has(raw)) continue;
    seen.add(raw);
    const plainWindow = decodedPlain.slice(Math.max(0, match.index - 120), Math.min(decodedPlain.length, match.index + match[1].length + 120));
    links.push({ raw_link: raw, link_text: raw, match_source: 'text', context_hint: plainWindow.replace(/\s+/g, ' ').trim() });
  }

  return links;
}

function parsePostFromHtml(postHtml) {
  const postIdMatch = postHtml.match(/data-content="post-(\d+)"/i) || postHtml.match(/id="js-post-(\d+)"/i);
  const postId = postIdMatch?.[1] || '';

  const authorMatch = postHtml.match(/data-author="([^"]+)"/i) || postHtml.match(/<h4 class="message-name">.*?<a[^>]*>(.*?)<\/a>/is);
  const parsedAuthor = decodeMinimalHtml(authorMatch?.[1] || '')
    .replace(/\s+/g, ' ')
    .trim();

  const dateMatch = postHtml.match(/<time[^>]*\s+datetime="([^"]+)"/i);
  const postDate = dateMatch?.[1] || '';

  const postText = stripTags(postHtml);
  const decodedPostText = decodeMinimalHtml(postText).replace(/\s+/g, ' ').trim();

  return {
    post_id: postId,
    post_author: parsedAuthor,
    post_date: postDate,
    post_text: decodedPostText
  };
}

function buildMessageExcerpt(postText, rawLink, contextHint) {
  const toSingleLine = (value) => String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const sanitizeSnippetText = (value) => String(value || '')
    .replace(/\b(target|rel|class|href|src)=["'][^"']*["']/gi, ' ')
    .replace(/\b[a-z]+\s+href\s*=?\s*[^"\s<>]*/gi, ' ')
    .replace(/["'<>]/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const normalizedPostText = toSingleLine(decodeMinimalHtml(postText));
  const normalizedContext = sanitizeSnippetText(toSingleLine(decodeMinimalHtml(contextHint)));

  if (!normalizedContext && !normalizedPostText) return '';

  const buildSnippet = (sourceText, search, before = 140, after = 180) => {
    const index = sourceText.indexOf(search);
    if (index < 0) return null;
    const start = Math.max(0, index - before);
    const end = Math.min(sourceText.length, index + search.length + after);
    const snippet = sourceText.slice(start, end).trim();
    return sanitizeSnippetText(`${start > 0 ? '...' : ''}${snippet}${end < sourceText.length ? '...' : ''}`);
  };

  const candidates = [];
  if (rawLink) candidates.push(rawLink);
  const decodedRaw = decodeMinimalHtml(rawLink);
  if (decodedRaw && decodedRaw !== rawLink) {
    candidates.push(decodedRaw);
  }

  try {
    const uriDecoded = decodeURIComponent(rawLink);
    if (uriDecoded && !candidates.includes(uriDecoded)) candidates.push(uriDecoded);
  } catch {}

  for (const sourceText of [normalizedPostText, normalizedContext]) {
    if (!sourceText) continue;
    for (const candidate of candidates) {
      const snippet = buildSnippet(sourceText, decodeMinimalHtml(candidate));
      if (snippet) return snippet;
    }
  }

  for (const sourceText of [normalizedContext, normalizedPostText]) {
    if (!sourceText) continue;
    if (sourceText.length <= 220) return `...${sourceText}...`;
  }

  return `...${(normalizedContext || normalizedPostText).slice(0, 220)}...`;
}

function splitPosts(threadHtml) {
  const chunks = [];
  const articleRegex = /<article\b[^>]*\bclass="[^"]*\bmessage message--post\b[^"]*"[\s\S]*?<\/article>/g;
  let match;
  while ((match = articleRegex.exec(threadHtml))) {
    chunks.push(match[0]);
  }

  if (!chunks.length) {
    const fallback = threadHtml.match(/<article[\s\S]*?id="js-post-[^"]*?"[\s\S]*?<\/article>/gi);
    return fallback || [];
  }

  return chunks;
}

function computeLinkHash(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function readJsonSafely(filePath, fallback) {
  return fs.readFile(filePath, 'utf8')
    .then((content) => {
      const data = JSON.parse(content);
      return data || fallback;
    })
    .catch(() => fallback);
}

function createInitialState() {
  return {
    version: '1.0',
    generated_at: new Date().toISOString(),
    sections: Object.fromEntries(
      SECTIONS.map(section => [section.url, {
        name: section.name,
        url: section.url,
        nextListingPage: 1,
        visitedListingPages: [],
        exhausted: false
      }])
    ),
    visitedThreads: {},
    linkStats: {},
    stats: {
      threadsVisited: 0,
      threadsSkipped: 0,
      linksCollected: 0,
      duplicateLinks: 0,
      errors: []
    },
    config: {
      delayMs: DEFAULT_CONFIG.delayMs,
      retryLimit: DEFAULT_CONFIG.retryLimit,
      retryBaseDelayMs: DEFAULT_CONFIG.retryBaseDelayMs
    }
  };
}

async function writeJsonLine(filePath, record) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(record)}\n`, 'utf8');
}

function parseMaxThreadPage(threadUrl, threadHtml) {
  const base = new URL(threadUrl).pathname.replace(/\/$/, '');
  const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${escapedBase}/page-(\\d+)`, 'g');
  let maxPage = 1;
  let match;

  while ((match = regex.exec(threadHtml))) {
    const candidate = Number(match[1]);
    if (Number.isInteger(candidate) && candidate > maxPage) maxPage = candidate;
  }

  return maxPage;
}

function parseMaxListingPage(sectionUrl, listingHtml) {
  const base = new URL(sectionUrl).pathname.replace(/\/$/, '');
  const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${escapedBase}/page-(\\d+)`, 'g');
  let maxPage = 1;
  let match;

  while ((match = regex.exec(listingHtml))) {
    const candidate = Number(match[1]);
    if (Number.isInteger(candidate) && candidate > maxPage) maxPage = candidate;
  }

  return maxPage;
}

function computeListingSignature(threadUrls) {
  return crypto
    .createHash('sha256')
    .update(threadUrls.join('\n'), 'utf8')
    .digest('hex');
}

function buildThreadPageUrl(baseThreadUrl, pageNumber) {
  return pageNumber <= 1 ? baseThreadUrl : safeJoin(baseThreadUrl, `page-${pageNumber}/`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestHtml(urlString, options) {
  let attempt = 0;
  let delay = options.retryBaseDelayMs;

  while (true) {
    attempt += 1;
    try {
      const response = await fetch(urlString, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ForumArchiveBot/1.0; +local-node)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      return response.text();
    } catch (error) {
      if (attempt > options.retryLimit + 1) {
        throw error;
      }

      await sleep(delay);
      delay *= 2;
      if (options.logger) {
        options.logger(`Retrying ${urlString} (attempt ${attempt}/${options.retryLimit})`);
      }
    }
  }
}

async function crawlThread(threadUrl, section, state, config, stateSaver) {
  const canonicalThreadUrl = buildCanonicalThreadUrl(threadUrl);
  const now = new Date().toISOString();
  const threadState = state.visitedThreads[canonicalThreadUrl];

  if (threadState && threadState.status === 'visited') {
    return { skipped: true };
  }

  state.visitedThreads[canonicalThreadUrl] = {
    first_seen: threadState?.first_seen || now,
    section_name: section.name,
    status: 'in_progress'
  };
  await stateSaver();

  let firstPageHtml;
  try {
    firstPageHtml = await requestHtml(canonicalThreadUrl, config);
  } catch (error) {
    state.stats.errors.push({
      kind: 'thread',
      thread_url: canonicalThreadUrl,
      error: String(error.message || error),
      when: now,
      action: 'fetch_thread_page_1'
    });
    await writeJsonLine(THREADS_PATH, {
      thread_url: canonicalThreadUrl,
      section_name: section.name,
      section_url: section.url,
      thread_title: '',
      thread_id: new URL(canonicalThreadUrl).pathname.match(/\/threads\/[^.]+\.(\d+)/)?.[1] || '',
      visited_at: now,
      pages_scanned: 0,
      links_found: 0,
      status: 'failed_fetch',
      error: String(error.message || error)
    });
    state.visitedThreads[canonicalThreadUrl] = {
      ...state.visitedThreads[canonicalThreadUrl],
      last_seen: new Date().toISOString(),
      status: 'failed_fetch',
      error: String(error.message || error)
    };
    await stateSaver();
    return { skipped: false, error: error.message || error };
  }

  const threadTitle = extractThreadTitle(firstPageHtml);
  const totalPages = parseMaxThreadPage(canonicalThreadUrl, firstPageHtml);

  let linksFound = 0;
  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    const pageUrl = buildThreadPageUrl(canonicalThreadUrl, pageNumber);
    const threadPageHtml = pageNumber === 1 ? firstPageHtml : await requestHtml(pageUrl, config);
    const postChunks = splitPosts(threadPageHtml);

    for (const postHtml of postChunks) {
      const parsedPost = parsePostFromHtml(postHtml);
      const links = extractLinksFromPostHtml(postHtml);
      if (!links.length) continue;

      const postUrl = canonicalPostUrl(canonicalThreadUrl, parsedPost.post_id);
      for (const link of links) {
        const rawLink = link.raw_link;
        const linkHash = computeLinkHash(rawLink);
        const previous = state.linkStats[linkHash];
        const occurrence = (previous?.occurrences || 0) + 1;
        const nowAt = new Date().toISOString();
        const excerpt = buildMessageExcerpt(parsedPost.post_text, rawLink, link.context_hint);
        const linkRecord = {
          raw_link: rawLink,
          link_hash: linkHash,
          section_name: section.name,
          section_url: section.url,
          thread_title: threadTitle,
          thread_url: canonicalThreadUrl,
          post_url: postUrl,
          post_id: parsedPost.post_id,
          post_author: parsedPost.post_author,
          post_date: parsedPost.post_date,
          link_text: link.link_text || rawLink,
          message_excerpt: excerpt,
          collected_at: nowAt,
          is_duplicate: !!previous,
          occurrence,
          occurrences: occurrence
        };
        await writeJsonLine(LINKS_PATH, linkRecord);

        state.linkStats[linkHash] = {
          raw_link: rawLink,
          occurrences: occurrence,
          last_seen: nowAt
        };
        linksFound += 1;
        state.stats.linksCollected += 1;
        if (previous) state.stats.duplicateLinks += 1;
      }
    }

    await sleep(config.delayMs);
  }

  state.visitedThreads[canonicalThreadUrl] = {
    first_seen: threadState?.first_seen || now,
    section_name: section.name,
    status: 'visited',
    last_seen: new Date().toISOString(),
    links_found: linksFound,
    pages_scanned: totalPages
  };

  state.stats.threadsVisited += 1;

  await writeJsonLine(THREADS_PATH, {
    thread_url: canonicalThreadUrl,
    thread_title: threadTitle,
    thread_id: new URL(canonicalThreadUrl).pathname.match(/\/threads\/[^.]+\.(\d+)/)?.[1] || '',
    section_name: section.name,
    section_url: section.url,
    visited_at: now,
    pages_scanned: totalPages,
    links_found: linksFound,
    status: linksFound ? 'visited' : 'visited_empty'
  });

  await stateSaver();
  return { skipped: false, linksFound, threadTitle, totalPages };
}

async function saveState(state) {
  await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
  state.updated_at = new Date().toISOString();
  await fs.writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const selectedSections = normalizeSectionSelection(options.sections);
  if (options.sections && !selectedSections.length) {
    throw new Error(`Sections inconnues: ${options.sections.join(', ')}`);
  }

  const sections = selectedSections || SECTIONS;
  const state = await readJsonSafely(STATE_PATH, createInitialState());
  state.config = state.config || {};
  state.config.delayMs = options.delayMs || state.config.delayMs || DEFAULT_CONFIG.delayMs;
  state.config.retryLimit = options.retryLimit ?? state.config.retryLimit ?? DEFAULT_CONFIG.retryLimit;
  state.config.retryBaseDelayMs = DEFAULT_CONFIG.retryBaseDelayMs;
  state.generated_at = state.generated_at || new Date().toISOString();
  state.config.requestTimeoutMs = options.requestTimeoutMs || state.config.requestTimeoutMs;

  const threadLimit = options.limitThreads;

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  let processedThreads = 0;
  for (const section of sections) {
    const sectionState = state.sections[section.url] || {
      name: section.name,
      url: section.url,
      nextListingPage: 1,
      visitedListingPages: [],
      exhausted: false
    };
    state.sections[section.url] = sectionState;

    const sectionName = section.name;
    const sectionPageLimit = options.limitPages || Infinity;
    let pageCounter = 0;

      while (!sectionState.exhausted && pageCounter < sectionPageLimit) {
      if (threadLimit && processedThreads >= threadLimit) break;

      const listingPage = sectionState.nextListingPage;
      const listingUrl = makeSectionUrl(section, listingPage);
      let listingHtml;

      try {
        listingHtml = await requestHtml(listingUrl, {
          delayMs: state.config.delayMs,
          retryLimit: state.config.retryLimit,
          retryBaseDelayMs: state.config.retryBaseDelayMs,
          logger: (message) => console.warn(`[retry] ${sectionName}: ${message}`)
        });
      } catch (error) {
        state.stats.errors.push({
          kind: 'listing',
          section_name: section.name,
          section_url: section.url,
          listing_url: listingUrl,
          error: String(error.message || error),
          when: new Date().toISOString(),
          action: 'fetch_listing'
        });
        sectionState.nextListingPage += 1;
        await saveState(state);
        await sleep(state.config.delayMs);
        continue;
      }

      const threadUrls = extractListingThreadUrls(section.url, listingHtml);
      const maxListingPage = parseMaxListingPage(section.url, listingHtml);
      if (listingPage > maxListingPage) {
        sectionState.exhausted = true;
        sectionState.exhaustedAt = new Date().toISOString();
        sectionState.exhaustionReason = `listing page ${listingPage} is beyond max page ${maxListingPage}`;
        sectionState.maxListingPage = maxListingPage;
        await saveState(state);
        break;
      }

      const listingSignature = computeListingSignature(threadUrls);
      const previousListingPage = sectionState.visitedListingPages.at(-1);
      if (previousListingPage?.thread_signature && previousListingPage.thread_signature === listingSignature) {
        sectionState.exhausted = true;
        sectionState.exhaustedAt = new Date().toISOString();
        sectionState.exhaustionReason = `listing page ${listingPage} repeats page ${previousListingPage.page}`;
        sectionState.maxListingPage = previousListingPage.page;
        await saveState(state);
        break;
      }

      sectionState.visitedListingPages.push({
        page: listingPage,
        seen_at: new Date().toISOString(),
        thread_count: threadUrls.length,
        thread_signature: listingSignature,
        max_listing_page_seen: maxListingPage
      });
      sectionState.maxListingPage = Math.max(sectionState.maxListingPage || 1, maxListingPage);
      sectionState.nextListingPage += 1;
      pageCounter += 1;

      if (!threadUrls.length) {
        sectionState.exhausted = true;
        await saveState(state);
        break;
      }

      let visitedInThisPage = 0;
      for (const threadUrl of threadUrls) {
        if (threadLimit && processedThreads >= threadLimit) break;
        if (state.visitedThreads[threadUrl]?.status === 'visited') {
          state.stats.threadsSkipped += 1;
          continue;
        }

        const result = await crawlThread(threadUrl, section, state, {
          delayMs: state.config.delayMs,
          retryLimit: state.config.retryLimit,
          retryBaseDelayMs: state.config.retryBaseDelayMs
        }, () => saveState(state));
        processedThreads += 1;
        visitedInThisPage += 1;

        if (result?.error) {
          console.warn(`[warn] ${sectionName}: ${threadUrl} -> ${result.error}`);
        }
      }

      sectionState.threadsVisitedOnLastPage = visitedInThisPage;
      await saveState(state);
      await sleep(state.config.delayMs);
    }
  }

  console.log(JSON.stringify(state.stats, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
