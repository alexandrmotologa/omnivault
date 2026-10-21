import { Article, Highlight } from './types';

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'local-first-software-kleppmann',
    url: 'https://www.inkandswitch.com/local-first/',
    title: 'Local-First Software: You Own Your Data, in spite of the Cloud',
    byline: 'Martin Kleppmann, Adam Wiggins, Peter van Hardenberg, Mark McGranaghan',
    excerpt: 'In this article we propose "local-first software": a set of principles for software that enables both collaboration and ownership. It gives users agency over their data.',
    site_name: 'Ink & Switch',
    published_at: '2019-05-02T10:00:00Z',
    saved_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    read_at: null,
    status: 'inbox',
    favorite: 1,
    reading_time_minutes: 8,
    word_count: 1850,
    scroll_progress: 0.15,
    tags: ['local-first', 'crdt', 'architecture', 'privacy'],
    rss_source_id: null,
    content_html: `
      <h2>The Cloud Gives and the Cloud Takes Away</h2>
      <p>Cloud applications like Google Docs and Trello are popular because they enable frictionless real-time collaboration with colleagues, and they make it easy for us to access our work from all of our devices.</p>
      <p>However, by centralizing data storage on servers controlled by a single vendor, cloud apps have also taken away all ownership and agency from users. If the service shuts down, the software stops working, and your data is locked away or lost forever.</p>
      <blockquote>We believe that users should not be forced to choose between the collaborative convenience of cloud software and the ownership and longevity of traditional desktop applications.</blockquote>
      <h2>Seven Ideals for Local-First Software</h2>
      <p>We propose seven design ideals for software that preserves user autonomy without sacrificing modern conveniences:</p>
      <ol>
        <li><strong>No spinners: your work at your fingertips.</strong> All read and write operations happen against local storage on the device. Network delays should never freeze the user interface.</li>
        <li><strong>Multi-device sync.</strong> Data synchronizes seamlessly across all user devices when connectivity is available, using conflict-free replicated data types or delta state synchronization.</li>
        <li><strong>The network is optional.</strong> Everything works fully offline. You can read, write, edit, and search without an internet connection.</li>
        <li><strong>Seamless collaboration.</strong> Real-time and asynchronous collaboration should be first-class citizens.</li>
        <li><strong>The long now.</strong> Documents created today should remain accessible twenty or thirty years from now, even if the original company ceases to exist.</li>
        <li><strong>Security and privacy by default.</strong> End-to-end encryption ensures that third parties and cloud relays cannot read your sensitive notes or reading history.</li>
        <li><strong>Ultimate user control.</strong> You can inspect, modify, backup, and export your data in open formats like SQLite and Markdown at any time.</li>
      </ol>
      <h2>Conclusion</h2>
      <p>Local-first is not about rejecting the internet or the cloud. Rather, it is about restoring balance: treating local storage as the primary source of truth, and treating the network as an auxiliary transport layer.</p>
    `,
    content_markdown: `## The Cloud Gives and the Cloud Takes Away

Cloud applications like Google Docs and Trello are popular because they enable frictionless real-time collaboration with colleagues, and they make it easy for us to access our work from all of our devices.

However, by centralizing data storage on servers controlled by a single vendor, cloud apps have also taken away all ownership and agency from users. If the service shuts down, the software stops working, and your data is locked away or lost forever.

> We believe that users should not be forced to choose between the collaborative convenience of cloud software and the ownership and longevity of traditional desktop applications.

## Seven Ideals for Local-First Software

We propose seven design ideals for software that preserves user autonomy without sacrificing modern conveniences:

1. **No spinners: your work at your fingertips.** All read and write operations happen against local storage on the device. Network delays should never freeze the user interface.
2. **Multi-device sync.** Data synchronizes seamlessly across all user devices when connectivity is available, using conflict-free replicated data types or delta state synchronization.
3. **The network is optional.** Everything works fully offline. You can read, write, edit, and search without an internet connection.
4. **Seamless collaboration.** Real-time and asynchronous collaboration should be first-class citizens.
5. **The long now.** Documents created today should remain accessible twenty or thirty years from now, even if the original company ceases to exist.
6. **Security and privacy by default.** End-to-end encryption ensures that third parties and cloud relays cannot read your sensitive notes or reading history.
7. **Ultimate user control.** You can inspect, modify, backup, and export your data in open formats like SQLite and Markdown at any time.

## Conclusion

Local-first is not about rejecting the internet or the cloud. Rather, it is about restoring balance: treating local storage as the primary source of truth, and treating the network as an auxiliary transport layer.`
  },
  {
    id: 'how-sqlite-is-tested-hipp',
    url: 'https://www.sqlite.org/testing.html',
    title: 'How SQLite Is Tested: Achieving 100% MC/DC Branch Coverage',
    byline: 'D. Richard Hipp',
    excerpt: 'The reliability and robustness of SQLite is achieved largely through automated test suites that execute over 2.5 million test cases with 100% modified condition branch coverage.',
    site_name: 'SQLite.org',
    published_at: '2023-11-14T14:30:00Z',
    saved_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    read_at: new Date(Date.now() - 86400000).toISOString(),
    status: 'reading',
    favorite: 1,
    reading_time_minutes: 6,
    word_count: 1420,
    scroll_progress: 0.45,
    tags: ['sqlite', 'testing', 'c', 'systems', 'quality'],
    rss_source_id: null,
    content_html: `
      <h2>Extreme Testing for Ubiquitous Infrastructure</h2>
      <p>SQLite is the most widely deployed database engine in the world. It operates inside billions of smartphones, web browsers, aircraft flight computers, automotive systems, and medical devices.</p>
      <p>Because SQLite operates at the foundational layer of global computing, defects can have catastrophic consequences. To prevent regressions, the SQLite development team maintains three distinct test suites:</p>
      <ul>
        <li><strong>TCL Test Suite:</strong> Over 25,000 distinct test scripts containing tens of thousands of SQL assertions, boundary condition checks, and error injection simulations.</li>
        <li><strong>TH3 (Test Harness #3):</strong> A proprietary, 100% C-language test harness that runs on bare metal without standard library dependencies, designed for safety-critical DO-178B aerospace qualification.</li>
        <li><strong>dbsqlfuzz:</strong> An automated fuzz tester driven by LibFuzzer and Google OSS-Fuzz that mutates database files and SQL statements to detect memory leaks, assertion failures, and undefined behavior.</li>
      </ul>
      <h2>100% Branch Coverage Under MC/DC</h2>
      <p>SQLite core code delivers 100% branch test coverage under Modified Condition / Decision Coverage (MC/DC) testing criteria. Every single decision outcome in the codebase has been verified under both true and false paths.</p>
      <blockquote>To achieve 100% branch coverage, every conditional branch must be executed both ways in a test. If code cannot be reached during testing, it is considered dead code and removed.</blockquote>
      <h2>Crash Resistance and Power-Loss Durability</h2>
      <p>Testing SQLite against unexpected power failure requires specialized hardware and kernel drivers. The test harness simulates sudden power cuts in the middle of disk writes, asserting that atomic commit logs (WAL mode) recover the database to a consistent transaction state without file corruption.</p>
    `,
    content_markdown: `## Extreme Testing for Ubiquitous Infrastructure

SQLite is the most widely deployed database engine in the world. It operates inside billions of smartphones, web browsers, aircraft flight computers, automotive systems, and medical devices.

Because SQLite operates at the foundational layer of global computing, defects can have catastrophic consequences. To prevent regressions, the SQLite development team maintains three distinct test suites:

- **TCL Test Suite:** Over 25,000 distinct test scripts containing tens of thousands of SQL assertions, boundary condition checks, and error injection simulations.
- **TH3 (Test Harness #3):** A proprietary, 100% C-language test harness that runs on bare metal without standard library dependencies, designed for safety-critical DO-178B aerospace qualification.
- **dbsqlfuzz:** An automated fuzz tester driven by LibFuzzer and Google OSS-Fuzz that mutates database files and SQL statements to detect memory leaks, assertion failures, and undefined behavior.

## 100% Branch Coverage Under MC/DC

SQLite core code delivers 100% branch test coverage under Modified Condition / Decision Coverage (MC/DC) testing criteria. Every single decision outcome in the codebase has been verified under both true and false paths.

> To achieve 100% branch coverage, every conditional branch must be executed both ways in a test. If code cannot be reached during testing, it is considered dead code and removed.

## Crash Resistance and Power-Loss Durability

Testing SQLite against unexpected power failure requires specialized hardware and kernel drivers. The test harness simulates sudden power cuts in the middle of disk writes, asserting that atomic commit logs (WAL mode) recover the database to a consistent transaction state without file corruption.`
  },
  {
    id: 'sqlite-fts5-architecture-deep-dive',
    url: 'https://sqlite.org/fts5.html',
    title: 'The Engineering of SQLite FTS5: Inverted Indexes and BM25 Ranking',
    byline: 'Database Systems Working Group',
    excerpt: 'An architectural breakdown of SQLite FTS5: how virtual tables parse tokens with Porter stemming, compress doclists using varints, and evaluate full-text search queries in sub-millisecond intervals.',
    site_name: 'Database Engineering Journal',
    published_at: '2024-03-18T09:00:00Z',
    saved_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    read_at: null,
    status: 'inbox',
    favorite: 0,
    reading_time_minutes: 5,
    word_count: 1200,
    scroll_progress: 0.0,
    tags: ['sqlite-fts5', 'search', 'algorithms', 'webassembly'],
    rss_source_id: null,
    content_html: `
      <h2>Virtual Tables and Inverted Index Internals</h2>
      <p>SQLite FTS5 is a virtual table module that provides text indexing capabilities directly inside standard SQLite databases. Unlike naive <code>LIKE '%query%'</code> scans that require a full table scan over every row, FTS5 builds a B-Tree backed inverted index.</p>
      <p>When an article is indexed, the FTS5 tokenizer extracts individual terms, normalizes them, and strips inflectional suffixes using the Porter stemming algorithm. The terms are mapped to document IDs in an inverted doclist.</p>
      <h2>The BM25 Relevance Scoring Function</h2>
      <p>SQLite FTS5 includes an implementation of the BM25 (Best Matching 25) ranking algorithm, an evolution of classic TF-IDF:</p>
      <pre><code>Score(D, Q) = SUM [ IDF(q_i) * (f(q_i, D) * (k1 + 1)) / (f(q_i, D) + k1 * (1 - b + b * (|D| / avgdl))) ]</code></pre>
      <p>BM25 penalizes excessively long documents and balances term frequency against inverse document frequency, ensuring that rare and specific terms rank higher than generic filler words.</p>
      <h2>Sub-Millisecond Search in WebAssembly</h2>
      <p>Running SQLite FTS5 in the browser via WebAssembly and OPFS (Origin Private File System) brings desktop-grade search speed to client-side applications. Queries against 10,000 saved articles complete in under 5 milliseconds with zero network requests.</p>
    `,
    content_markdown: `## Virtual Tables and Inverted Index Internals

SQLite FTS5 is a virtual table module that provides text indexing capabilities directly inside standard SQLite databases. Unlike naive \`LIKE '%query%'\` scans that require a full table scan over every row, FTS5 builds a B-Tree backed inverted index.

When an article is indexed, the FTS5 tokenizer extracts individual terms, normalizes them, and strips inflectional suffixes using the Porter stemming algorithm. The terms are mapped to document IDs in an inverted doclist.

## The BM25 Relevance Scoring Function

SQLite FTS5 includes an implementation of the BM25 (Best Matching 25) ranking algorithm, an evolution of classic TF-IDF:

\`\`\`text
Score(D, Q) = SUM [ IDF(q_i) * (f(q_i, D) * (k1 + 1)) / (f(q_i, D) + k1 * (1 - b + b * (|D| / avgdl))) ]
\`\`\`

BM25 penalizes excessively long documents and balances term frequency against inverse document frequency, ensuring that rare and specific terms rank higher than generic filler words.

## Sub-Millisecond Search in WebAssembly

Running SQLite FTS5 in the browser via WebAssembly and OPFS (Origin Private File System) brings desktop-grade search speed to client-side applications. Queries against 10,000 saved articles complete in under 5 milliseconds with zero network requests.`
  },
  {
    id: 'omnivore-shutdown-postmortem-2024',
    url: 'https://news.ycombinator.com/item?id=42012345',
    title: 'Why Omnivore Shut Down in 2024: The Imperative for Zero-Cloud Research Vaults',
    byline: 'Elena Vance, Research Infrastructure Analyst',
    excerpt: 'The acquisition and sudden sunset of Omnivore left thousands of developers without their reading archives. This postmortem examines how local-first vaults prevent data hostage scenarios.',
    site_name: 'Hacker News Dispatch',
    published_at: '2024-11-05T16:00:00Z',
    saved_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    read_at: null,
    status: 'archived',
    favorite: 1,
    reading_time_minutes: 7,
    word_count: 1600,
    scroll_progress: 0.9,
    tags: ['omnivore', 'pkm', 'read-it-later', 'data-ownership', 'obsidian'],
    rss_source_id: null,
    content_html: `
      <h2>The Anatomy of a Service Sunset</h2>
      <p>In late 2024, the popular open-source read-it-later service Omnivore announced that its hosted cloud service would shut down after the team was acquired. Users were given a brief window to export their articles and annotations before servers were decommissioned.</p>
      <p>For thousands of researchers, engineers, and students who relied on Omnivore as their digital brain, this was a reminder of cloud fragility. Even when an application is open source, if the synchronization layer depends on centralized servers, users remain vulnerable to corporate transitions.</p>
      <blockquote>If your notes and reading vault live solely in someone else's database, your knowledge graph exists on borrowed time.</blockquote>
      <h2>Why Local-First Vaults Win</h2>
      <p>The solution is an architecture where data lives locally first: stored in client-side SQLite databases, synced directly into Obsidian or local Markdown directories, and accessible without login barriers or API quotas.</p>
      <p>Tools like Omnivault embody this philosophy: they compile modern web standards like WebAssembly, OPFS, and Web Speech directly onto the user's hardware. You get instant full-text search, offline audio playback, and bidirectional export without a single byte leaving your machine.</p>
    `,
    content_markdown: `## The Anatomy of a Service Sunset

In late 2024, the popular open-source read-it-later service Omnivore announced that its hosted cloud service would shut down after the team was acquired. Users were given a brief window to export their articles and annotations before servers were decommissioned.

For thousands of researchers, engineers, and students who relied on Omnivore as their digital brain, this was a reminder of cloud fragility. Even when an application is open source, if the synchronization layer depends on centralized servers, users remain vulnerable to corporate transitions.

> If your notes and reading vault live solely in someone else's database, your knowledge graph exists on borrowed time.

## Why Local-First Vaults Win

The solution is an architecture where data lives locally first: stored in client-side SQLite databases, synced directly into Obsidian or local Markdown directories, and accessible without login barriers or API quotas.

Tools like Omnivault embody this philosophy: they compile modern web standards like WebAssembly, OPFS, and Web Speech directly onto the user's hardware. You get instant full-text search, offline audio playback, and bidirectional export without a single byte leaving your machine.`
  }
];

export const INITIAL_HIGHLIGHTS: Highlight[] = [
  {
    id: 'hl-1',
    article_id: 'local-first-software-kleppmann',
    text: 'We believe that users should not be forced to choose between the collaborative convenience of cloud software and the ownership and longevity of traditional desktop applications.',
    note: 'Core thesis of Omnivault: bridging browser convenience with desktop data ownership.',
    color: 'yellow',
    prefix: 'lost forever.',
    suffix: 'Seven Ideals',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'hl-2',
    article_id: 'local-first-software-kleppmann',
    text: 'The network is optional. Everything works fully offline. You can read, write, edit, and search without an internet connection.',
    note: 'Principle 3 is non-negotiable for research vaults.',
    color: 'green',
    prefix: 'connectivity is available,',
    suffix: 'Seamless collaboration.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'hl-3',
    article_id: 'how-sqlite-is-tested-hipp',
    text: 'To achieve 100% branch coverage, every conditional branch must be executed both ways in a test.',
    note: 'Extreme engineering discipline that makes SQLite practically unbreakable.',
    color: 'blue',
    prefix: 'MC/DC testing criteria.',
    suffix: 'Crash Resistance',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'hl-4',
    article_id: 'omnivore-shutdown-postmortem-2024',
    text: 'If your notes and reading vault live solely in someone else\'s database, your knowledge graph exists on borrowed time.',
    note: 'Quote of the year for PKM tooling.',
    color: 'pink',
    prefix: 'corporate transitions.',
    suffix: 'Why Local-First Vaults Win',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 6).toISOString()
  }
];

export const INITIAL_FEEDS = [
  {
    id: 'feed-hacker-news',
    title: 'Hacker News Best',
    url: 'https://hnrss.org/best',
    site_url: 'https://news.ycombinator.com',
    icon_url: 'https://news.ycombinator.com/favicon.ico',
    last_fetched_at: null,
    unread_count: 12
  },
  {
    id: 'feed-simonw',
    title: 'Simon Willison’s Weblog',
    url: 'https://simonwillison.net/atom/entries/',
    site_url: 'https://simonwillison.net',
    icon_url: 'https://simonwillison.net/static/favicon.ico',
    last_fetched_at: null,
    unread_count: 5
  },
  {
    id: 'feed-martin-fowler',
    title: 'Martin Fowler',
    url: 'https://martinfowler.com/feed.atom',
    site_url: 'https://martinfowler.com',
    icon_url: 'https://martinfowler.com/favicon.ico',
    last_fetched_at: null,
    unread_count: 3
  }
];
