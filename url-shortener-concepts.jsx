import { useState } from "react";

const concepts = [
  {
    title: "Throughput vs Latency vs Storage",
    tag: "Performance",
    color: "#22c55e",
    bg: "#052e16",
    preview: "Related but not correlated — high throughput doesn't mean low latency.",
    sections: [
      {
        heading: "Definitions",
        items: [
          "Throughput — requests processed per second (RPS). URL shortener at scale targets 10k+ RPS.",
          "Latency — time for a single request to complete end-to-end. Users feel this directly.",
          "Storage — total data persisted. URL mappings are ~100 bytes each, but billions of links adds up.",
        ],
      },
      {
        heading: "Why not correlated?",
        items: [
          "A batch pipeline can process 1M records/hour but each record takes seconds — high throughput, high latency.",
          "Compression reduces storage but increases CPU → can increase latency.",
          "For URL shorteners: redirects are latency-sensitive; new link creation can tolerate more delay.",
        ],
      },
      {
        heading: "Reading too much from a DB",
        items: [
          "Disk I/O is the bottleneck. Even SSDs are orders of magnitude slower than RAM.",
          "Full table scans kill throughput. DB indexes solve this — a B-tree index on short_code makes lookup O(log n) instead of O(n).",
        ],
      },
    ],
  },
  {
    title: "Why a single DB can't handle 10k RPS",
    tag: "Scaling",
    color: "#38bdf8",
    bg: "#0c1a2e",
    preview: "One node, one CPU, one lock manager. ACID guarantees have coordination costs.",
    sections: [
      {
        heading: "The problem",
        items: [
          "A single DB node has finite CPU, disk I/O, and connection slots. Hot rows cause lock contention.",
          "ACID guarantees require coordination — writes can't just be parallelised arbitrarily.",
          "A single Postgres instance saturates around 1–5k RPS on mixed read/write workloads.",
        ],
      },
      {
        heading: "Solutions",
        items: [
          "Read replicas — leader handles writes, replicas serve reads. Redirects dominate, so this buys a lot.",
          "Multi-leader / active-active — multiple nodes accept writes. Requires conflict resolution strategy.",
          "Sharding — split data by hash of short_code across N nodes. Scales writes linearly.",
          "Redis (in-memory) — put the hot read path in front of the DB entirely. Cuts 99% of DB reads.",
        ],
      },
    ],
  },
  {
    title: "HTTP redirects & caching",
    tag: "HTTP",
    color: "#f97316",
    bg: "#1c0a00",
    preview: "301 vs 302 determines whether the browser caches — and whether you keep analytics.",
    sections: [
      {
        heading: "How the browser knows to redirect",
        items: [
          "HTTP response status: 301 Moved Permanently or 302 Found.",
          "Response includes a Location: https://original-url.com header.",
          "Browser follows it automatically — no JS needed.",
        ],
      },
      {
        heading: "301 vs 302",
        items: [
          "301 Permanent — browser caches it locally. Second visit never hits your server. Bad for analytics — you lose the click event.",
          "302 Temporary — browser always re-checks. Every click hits your server → you can log it. Use this for URL shorteners.",
        ],
      },
      {
        heading: "What caches a redirect?",
        items: [
          "Browser cache, CDN edge nodes, reverse proxies (Nginx, API Gateway).",
          "Cache-Control: max-age=3600 tells CDNs and browsers to cache the response for 1 hour.",
          "ETag / Last-Modified enable conditional revalidation — server returns 304 Not Modified if unchanged.",
        ],
      },
    ],
  },
  {
    title: "Redis — in-memory store",
    tag: "Caching",
    color: "#fb923c",
    bg: "#1c0d00",
    preview: "Single-threaded, sub-millisecond reads. Perfect for the hot redirect lookup path.",
    sections: [
      {
        heading: "Why Redis for URL shortener",
        items: [
          "short_code → long_url lookup is a pure key-value GET. Redis does this in ~0.1ms vs ~5ms for Postgres.",
          "Cache-aside pattern: check Redis first → hit returns immediately → miss queries DB and populates cache.",
        ],
      },
      {
        heading: "Single-threaded design",
        items: [
          "Redis processes commands one at a time. No lock contention, no race conditions on single commands.",
          "Speed comes from being entirely in-memory + an efficient event loop (similar to Node.js).",
          "I/O is multiplexed — thousands of concurrent connections, one thread handles them sequentially.",
        ],
      },
      {
        heading: "Bloom filter",
        items: [
          "Before querying DB for a short code, check a Bloom filter: 'does this key definitely not exist?'",
          "Probabilistic — no false negatives. Prevents cache stampede on non-existent keys.",
          "Stops attackers from DoS-ing your DB by requesting random short codes.",
        ],
      },
    ],
  },
  {
    title: "Hashing — MD5 / SHA-256",
    tag: "Hashing",
    color: "#a78bfa",
    bg: "#130d2e",
    preview: "Hash the long URL to generate the short code. Handle collisions with retries or salting.",
    sections: [
      {
        heading: "The approach",
        items: [
          "Long URL → MD5 or SHA-256 → take first 6–8 hex chars → that's the short code.",
          "MD5: 128-bit hash. SHA-256: 256-bit. Both are fine for this use case.",
          "Base62 (a-z, A-Z, 0-9): 62^6 ≈ 56 billion unique codes from 6 characters.",
        ],
      },
      {
        heading: "Collisions & retries",
        items: [
          "Two different long URLs can produce the same first 6 chars — rare but possible.",
          "Retry strategy: on collision, append a salt (counter or timestamp) and re-hash until unique.",
          "Alternative: auto-increment counter encoded to Base62 — deterministic, zero collisions.",
        ],
      },
      {
        heading: "SPOF risk",
        items: [
          "A single ID generator node is a Single Point of Failure — it goes down, no new short URLs can be created.",
          "Solution: pre-generate ID ranges distributed across nodes (like Twitter Snowflake IDs).",
        ],
      },
    ],
  },
  {
    title: "API Gateway & reverse proxy",
    tag: "Scaling",
    color: "#38bdf8",
    bg: "#0c1a2e",
    preview: "Sits in front of your services. Routes, rate-limits, authenticates, terminates TLS.",
    sections: [
      {
        heading: "What is a reverse proxy?",
        items: [
          "A server that accepts requests on behalf of backend services. Clients talk to the proxy, not directly to your app.",
          "Nginx, HAProxy, AWS ALB, Cloudflare are common examples.",
        ],
      },
      {
        heading: "API Gateway use cases",
        items: [
          "Routing — /s/{code} → redirect service, /api/create → creation service.",
          "Rate limiting — cap at N requests/second per IP or API key. Prevent abuse.",
          "Auth — validate JWT tokens before requests reach your services.",
          "TLS termination — HTTPS at the gateway; internal traffic can be plain HTTP.",
          "Analytics/logging — log every request without touching application code.",
        ],
      },
      {
        heading: "Tightly vs loosely coupled",
        items: [
          "Tightly coupled: redirect service calls analytics inline. Slow analytics = slow redirects.",
          "Loosely coupled: redirect logs an event to a queue (Kafka, SQS). Analytics consumes async. Redirect stays fast.",
        ],
      },
    ],
  },
  {
    title: "Sharding strategies",
    tag: "Storage",
    color: "#34d399",
    bg: "#022c1a",
    preview: "Split data across DB nodes so no single node holds all the load.",
    sections: [
      {
        heading: "Strategies",
        items: [
          "Hash-based — shard = hash(short_code) % N. Uniform distribution, but resharding is painful.",
          "Range-based — shard by short code prefix. Easy range scans, risk of hotspots.",
          "Consistent hashing — virtual nodes on a ring. Adding a node only moves ~1/N keys. Used by DynamoDB, Cassandra.",
        ],
      },
      {
        heading: "Tradeoffs",
        items: [
          "No cross-shard joins — keep related data on the same shard.",
          "Rebalancing is expensive — plan your shard key carefully upfront.",
          "Each shard can have its own read replicas for additional read scale.",
        ],
      },
    ],
  },
  {
    title: "ACID & consistency",
    tag: "Storage",
    color: "#34d399",
    bg: "#022c1a",
    preview: "Atomicity, Consistency, Isolation, Durability — the guarantees RDBMS provide.",
    sections: [
      {
        heading: "ACID breakdown",
        items: [
          "Atomicity — transaction fully completes or fully rolls back. No partial writes.",
          "Consistency — DB moves between valid states. Unique/FK constraints always hold.",
          "Isolation — concurrent transactions don't see each other's intermediate state.",
          "Durability — committed data survives crashes. Written to disk/WAL before acking.",
        ],
      },
      {
        heading: "URL shortener relevance",
        items: [
          "Unique constraint on short_code enforces no duplicates at the DB level — even if two requests race.",
          "ACID is why you can trust the constraint, but locks and fsync slow things down.",
          "NoSQL (Cassandra, DynamoDB) offer eventual consistency — faster writes, but a read immediately after a write might miss it.",
        ],
      },
    ],
  },
  {
    title: "SPOF — single point of failure",
    tag: "Reliability",
    color: "#f87171",
    bg: "#1c0505",
    preview: "Any node whose failure takes down the whole system. Must be eliminated for production.",
    sections: [
      {
        heading: "Examples in URL shortener",
        items: [
          "Single DB with no replica — crash = service down.",
          "Single Redis instance — cache failure → all load hits DB → DB overwhelmed.",
          "Single ID generator — can't create new short URLs.",
          "Single availability zone — AZ outage = full outage.",
        ],
      },
      {
        heading: "Mitigation",
        items: [
          "Redundancy — run N instances; lose one, others pick up load.",
          "Read replicas — DB leader fails, promote a replica.",
          "Redis Sentinel / Cluster — automatic leader election on Redis failure.",
          "Multi-AZ deployment — cloud providers auto-failover managed DBs (RDS Multi-AZ).",
        ],
      },
    ],
  },
  {
    title: "HTTP vs gRPC vs tRPC",
    tag: "HTTP",
    color: "#f97316",
    bg: "#1c0a00",
    preview: "REST for public APIs; gRPC for internal services; tRPC for TypeScript monorepos.",
    sections: [
      {
        heading: "REST / HTTP",
        items: [
          "Human-readable JSON. Universal browser support. Easy to debug with curl.",
          "Overhead: text parsing, verbose headers, no built-in schema enforcement.",
          "Use for: public API, browser clients, anywhere you need simplicity.",
        ],
      },
      {
        heading: "gRPC",
        items: [
          "Binary protocol (Protocol Buffers). ~5-10x smaller payload, faster parsing.",
          "Strongly typed schema in .proto files — auto-generates client and server code.",
          "Built on HTTP/2: multiplexed streams, bidirectional streaming.",
          "Use for: internal microservice calls where throughput matters.",
        ],
      },
      {
        heading: "tRPC",
        items: [
          "Not really a wire protocol — it's TypeScript RPC. Shares types end-to-end between Next.js and Node.",
          "No code generation step. Types are inferred automatically.",
          "Use for: TypeScript full-stack monorepos only. Not cross-language.",
        ],
      },
    ],
  },
  {
    title: "DB indexes",
    tag: "Performance",
    color: "#22c55e",
    bg: "#052e16",
    preview: "Without an index on short_code, every lookup is a full table scan — brutal at scale.",
    sections: [
      {
        heading: "What an index does",
        items: [
          "A B-tree index on short_code lets the DB jump directly to the row — O(log n) instead of O(n).",
          "The index is a separate data structure maintained alongside the table. Writes slower; reads dramatically faster.",
        ],
      },
      {
        heading: "Covering index",
        items: [
          "If the index includes all needed columns (short_code, long_url), the DB never touches the main table.",
          "Pure index scan — the fastest possible read path.",
        ],
      },
      {
        heading: "When indexes hurt",
        items: [
          "Every write must update all indexes. High write throughput + many indexes = slower inserts.",
          "For URL shortener: one index on short_code is enough. Don't over-index.",
        ],
      },
    ],
  },
  {
    title: "Why analytics? Purpose of short URLs",
    tag: "HTTP",
    color: "#f97316",
    bg: "#1c0a00",
    preview: "Short URLs route all clicks through your service — a perfect analytics funnel.",
    sections: [
      {
        heading: "Purpose of URL shortening",
        items: [
          "Character limits (SMS, early Twitter).",
          "Cleaner, shareable links. Redirect management — update destination without changing the short link.",
          "Core business model of Bitly — the short link is free; the analytics dashboard is paid.",
        ],
      },
      {
        heading: "What to track",
        items: [
          "Click count per short URL.",
          "Referrer (where the user came from), User-Agent (device/browser), IP geolocation.",
        ],
      },
      {
        heading: "Implementation",
        items: [
          "Log asynchronously — write to a queue (Kafka, SQS), don't block the redirect.",
          "Redirect latency should be ~5ms. Analytics logging can be seconds behind.",
        ],
      },
    ],
  },
];

const TAGS = ["All", "Scaling", "Storage", "Caching", "HTTP", "Hashing", "Performance", "Reliability"];

const TAG_STYLES = {
  Scaling:     { color: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
  Storage:     { color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  Caching:     { color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  HTTP:        { color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  Hashing:     { color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  Performance: { color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  Reliability: { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

export default function App() {
  const [activeTag, setActiveTag] = useState("All");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(null);

  const filtered = concepts.filter(c => {
    const matchTag = activeTag === "All" || c.tag === activeTag;
    const q = query.toLowerCase();
    const matchQ = !q || c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q) || c.tag.toLowerCase().includes(q);
    return matchTag && matchQ;
  });

  const selected = open !== null ? concepts[open] : null;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e5e5e5", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", padding: "2rem 1.5rem" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .card-hover { transition: transform 0.15s ease, border-color 0.15s ease; cursor: pointer; }
        .card-hover:hover { transform: translateY(-2px); }
        .tag-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: inherit; }
        .search-input { background: #111; border: 1px solid #222; border-radius: 8px; padding: 10px 14px; color: #e5e5e5; font-size: 14px; font-family: inherit; outline: none; width: 100%; transition: border-color 0.15s; }
        .search-input:focus { border-color: #444; }
        .search-input::placeholder { color: #555; }
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 1.5rem; backdrop-filter: blur(4px); }
        .modal-box { background: #0f0f0f; border: 1px solid #222; border-radius: 14px; max-width: 580px; width: 100%; max-height: 80vh; overflow-y: auto; padding: 1.75rem; }
        li { list-style: none; position: relative; padding-left: 1.25rem; }
        li::before { content: '—'; position: absolute; left: 0; color: #444; font-size: 12px; top: 3px; }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
            <span style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500 }}>System Design</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: "#f5f5f5", letterSpacing: "-0.02em", marginBottom: 6 }}>URL Shortener — Concepts</h1>
          <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>Interview prep reference. {concepts.length} concepts covering scaling, caching, storage, HTTP, and reliability.</p>
        </div>

        {/* Search */}
        <input
          className="search-input"
          placeholder="Search concepts..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ marginBottom: "1rem" }}
        />

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1.5rem" }}>
          {TAGS.map(t => {
            const isActive = activeTag === t;
            const style = TAG_STYLES[t];
            return (
              <button
                key={t}
                className="tag-btn"
                onClick={() => setActiveTag(t)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  background: isActive ? (style?.bg || "rgba(255,255,255,0.1)") : "transparent",
                  color: isActive ? (style?.color || "#e5e5e5") : "#666",
                  border: `1px solid ${isActive ? (style?.color + "44" || "#444") : "#222"}`,
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
          {filtered.map((c, i) => {
            const ts = TAG_STYLES[c.tag] || {};
            const idx = concepts.indexOf(c);
            return (
              <div
                key={i}
                className="card-hover"
                onClick={() => setOpen(idx)}
                style={{
                  background: "#0f0f0f",
                  border: "1px solid #1e1e1e",
                  borderRadius: 12,
                  padding: "1.1rem 1.25rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 500,
                    padding: "3px 9px",
                    borderRadius: 20,
                    background: ts.bg || "rgba(255,255,255,0.08)",
                    color: ts.color || "#aaa",
                    letterSpacing: "0.03em",
                  }}>{c.tag}</span>
                  <span style={{ fontSize: 16, color: "#333" }}>↗</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#e5e5e5", marginBottom: 6, lineHeight: 1.4 }}>{c.title}</div>
                <div style={{ fontSize: 13, color: "#666", lineHeight: 1.55 }}>{c.preview}</div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: "#444", fontSize: 14 }}>No concepts match — try clearing the filter.</div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setOpen(null)}>
          <div className="modal-box">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 500,
                  padding: "3px 9px",
                  borderRadius: 20,
                  background: TAG_STYLES[selected.tag]?.bg || "rgba(255,255,255,0.08)",
                  color: TAG_STYLES[selected.tag]?.color || "#aaa",
                  display: "inline-block",
                  marginBottom: 8,
                }}>{selected.tag}</span>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: "#f5f5f5", lineHeight: 1.35 }}>{selected.title}</h2>
              </div>
              <button
                onClick={() => setOpen(null)}
                style={{ background: "none", border: "1px solid #2a2a2a", color: "#666", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, fontFamily: "inherit", flexShrink: 0, marginLeft: 12 }}
              >close</button>
            </div>

            {selected.sections.map((s, i) => (
              <div key={i} style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.heading}</div>
                <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {s.items.map((item, j) => (
                    <li key={j} style={{ fontSize: 13.5, color: "#b0b0b0", lineHeight: 1.6 }}>
                      {item.includes(" — ") ? (
                        <>
                          <span style={{ color: "#e5e5e5", fontWeight: 500 }}>{item.split(" — ")[0]}</span>
                          {" — "}
                          {item.split(" — ").slice(1).join(" — ")}
                        </>
                      ) : item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Nav */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #1e1e1e" }}>
              <button
                onClick={() => setOpen(o => Math.max(0, o - 1))}
                disabled={open === 0}
                style={{ background: "none", border: "1px solid #2a2a2a", color: open === 0 ? "#333" : "#888", borderRadius: 8, padding: "6px 14px", cursor: open === 0 ? "default" : "pointer", fontSize: 13, fontFamily: "inherit" }}
              >← prev</button>
              <span style={{ fontSize: 12, color: "#444", alignSelf: "center" }}>{open + 1} / {concepts.length}</span>
              <button
                onClick={() => setOpen(o => Math.min(concepts.length - 1, o + 1))}
                disabled={open === concepts.length - 1}
                style={{ background: "none", border: "1px solid #2a2a2a", color: open === concepts.length - 1 ? "#333" : "#888", borderRadius: 8, padding: "6px 14px", cursor: open === concepts.length - 1 ? "default" : "pointer", fontSize: 13, fontFamily: "inherit" }}
              >next →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
