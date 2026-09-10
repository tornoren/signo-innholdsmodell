import { useState, useEffect, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import Papa from "papaparse";
import ExampleContent from "./ExampleContent";

const SHEET_URL = "https://docs.google.com/spreadsheets/d/16iXpb6OqVpb7g9E-rJ8b2_pLlyxf8Y4J_yR5z5kIcqE/edit";

const PALETTE = [
  ["#E1F5EE", "#085041"],
  ["#EEEDFE", "#3C3489"],
  ["#FAECE7", "#712B13"],
  ["#E6F1FB", "#0C447C"],
  ["#FBEAF0", "#72243E"],
  ["#EAF3DE", "#27500A"],
  ["#FAEEDA", "#633806"],
  ["#FCEBEB", "#791F1F"],
  ["#E4F3F8", "#0B4A5C"],
  ["#F3EAF9", "#4A1F6E"],
  ["#FDF3E1", "#6B4A05"],
  ["#E8F6E3", "#1E5A2E"],
  ["#F9E9E1", "#6E3416"],
  ["#E9EEF9", "#243A73"],
];

const NEUTRAL = ["Tekstfelt", "Standard", "Globalt"];

function colorFor(index) {
  if (index < PALETTE.length) return PALETTE[index];
  const hue = Math.round(((index - PALETTE.length) * 137.5) % 360);
  return [`hsl(${hue} 60% 93%)`, `hsl(${hue} 55% 22%)`];
}

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzyY2jEw0I5MTSaFvrsCnjjjKIaQTZcmqSBtXeIYlUZUIjVL13AJ6Z97XxYVH9tOCcQNOzZaLRRVcX/pub?output=csv";

const HIERARCHY_GID = "1387799651";
const TJENESTE_GID = "528600700";

async function fetchCsv(url) {
  const res = await fetch(`${url}&t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Kunne ikke hente arket (${res.status})`);
  const text = await res.text();
  return Papa.parse(text, { skipEmptyLines: true }).data;
}

async function fetchRows() {
  const data = await fetchCsv(CSV_URL);

  const norm = (s) => (s || "").toString().trim().toLowerCase();
  let headerIdx = data.findIndex((r) => {
    const h = r.map(norm);
    return h.includes("innholdstype") || h.includes("sidetype");
  });
  if (headerIdx === -1) throw new Error("Fant ingen kolonne som heter Innholdstype");

  const header = data[headerIdx].map(norm).map((h) => (h === "innholdstype" ? "sidetype" : h));
  const col = (k) => header.findIndex((h) => h === k || h.startsWith(k));
  const idx = {
    sidetype: col("sidetype"),
    felt: col("felt"),
    komponent: col("komponent"),
    type: col("type"),
    kommentar: col("kommentar"),
    status: col("status"),
  };
  const get = (row, k) => (idx[k] === -1 ? "" : (row[idx[k]] || "").toString().trim());

  const rows = data
    .slice(headerIdx + 1)
    .map((r) => ({
      sidetype: get(r, "sidetype"),
      felt: get(r, "felt"),
      komponent: get(r, "komponent"),
      type: get(r, "type"),
      kommentar: get(r, "kommentar"),
      status: get(r, "status"),
    }))
    .filter((r) => r.sidetype);

  if (rows.length === 0) throw new Error("Fant ingen rader i arket");
  return rows;
}

async function fetchHierarchyRows() {
  const data = await fetchCsv(`${CSV_URL}&gid=${HIERARCHY_GID}`);

  const norm = (s) => (s || "").toString().trim().toLowerCase();
  const headerIdx = data.findIndex((r) => r.map(norm).includes("side"));
  if (headerIdx === -1) throw new Error("Fant ingen kolonne som heter Side i hierarki-arket");

  const header = data[headerIdx].map(norm);
  const col = (k) => header.findIndex((h) => h === k || h.startsWith(k));
  const idx = {
    side: col("side"),
    morside: col("morside"),
    sidemal: col("sidemal"),
    funksjon: col("funksjon"),
  };
  const get = (row, k) => (idx[k] === -1 ? "" : (row[idx[k]] || "").toString().trim());

  return data
    .slice(headerIdx + 1)
    .map((r) => ({
      side: get(r, "side"),
      morside: get(r, "morside"),
      sidemal: get(r, "sidemal"),
      funksjon: get(r, "funksjon"),
    }))
    .filter((r) => r.side);
}

async function fetchTjenesteRows() {
  const data = await fetchCsv(`${CSV_URL}&gid=${TJENESTE_GID}`);

  const norm = (s) => (s || "").toString().trim().toLowerCase();
  const headerIdx = data.findIndex((r) => r.map(norm).includes("tjeneste"));
  if (headerIdx === -1) throw new Error("Fant ingen kolonne som heter Tjeneste i tjenestelisten");

  const header = data[headerIdx].map(norm);
  const col = (k) => header.findIndex((h) => h === k || h.startsWith(k));
  const idx = {
    tjeneste: col("tjeneste"),
    tjenestekategori: col("tjenestekategori"),
    malgruppe: col("målgruppe"),
    virksomhet: col("virksomhet"),
    poststed: col("poststed"),
    lenke: col("lenke"),
  };
  const get = (row, k) => (idx[k] === -1 ? "" : (row[idx[k]] || "").toString().trim());

  return data
    .slice(headerIdx + 1)
    .map((r) => ({
      tjeneste: get(r, "tjeneste"),
      tjenestekategori: get(r, "tjenestekategori"),
      malgruppe: get(r, "malgruppe"),
      virksomhet: get(r, "virksomhet"),
      poststed: get(r, "poststed"),
      lenke: get(r, "lenke"),
    }))
    .filter((r) => r.tjeneste);
}

function TreeNode({ node }) {
  return (
    <li>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2">
        <span className="text-[15px] font-medium text-neutral-900">{node.name}</span>
        {node.sidemal && (
          <span className="rounded-full border border-neutral-300 px-2 py-0.5 text-[11px] font-normal text-neutral-500">
            {node.sidemal}
          </span>
        )}
        {node.funksjon && <span className="text-xs text-neutral-500">{node.funksjon}</span>}
      </div>
      {node.children.length > 0 && (
        <ul className="mt-2 ml-3 space-y-2 border-l border-neutral-200 pl-4">
          {node.children.map((c) => (
            <TreeNode key={c.name} node={c} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function App() {
  const [rows, setRows] = useState([]);
  const [hierarchyRows, setHierarchyRows] = useState([]);
  const [tjenesteRows, setTjenesteRows] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(null);
  const [view, setView] = useState("sidetype");
  const [tjSok, setTjSok] = useState("");
  const [tjKategori, setTjKategori] = useState([]);
  const [tjPoststed, setTjPoststed] = useState([]);
  const [tjVirksomhet, setTjVirksomhet] = useState([]);

  const load = async () => {
    setStatus("loading");
    setError("");
    try {
      const [r, h, t] = await Promise.all([fetchRows(), fetchHierarchyRows(), fetchTjenesteRows()]);
      setRows(r);
      setHierarchyRows(h);
      setTjenesteRows(t);
      setUpdated(new Date());
      setStatus("ready");
    } catch (e) {
      setError(e.message || "Ukjent feil");
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const komponenter = useMemo(() => {
    const counts = {};
    rows.forEach((r) => {
      if (!r.komponent) return;
      counts[r.komponent] = (counts[r.komponent] || 0) + 1;
    });
    const names = Object.keys(counts);
    const colored = names
      .filter((n) => !NEUTRAL.includes(n))
      .sort((a, b) => counts[b] - counts[a] || a.localeCompare(b, "nb"));
    const colors = {};
    colored.forEach((n, i) => {
      colors[n] = colorFor(i);
    });
    return { counts, colors, ordered: [...colored, ...NEUTRAL].filter((n) => counts[n]) };
  }, [rows]);

  const bySidetype = useMemo(() => {
    const m = {};
    const order = [];
    rows.forEach((r) => {
      if (!m[r.sidetype]) {
        m[r.sidetype] = [];
        order.push(r.sidetype);
      }
      m[r.sidetype].push(r);
    });
    return order.map((k) => ({ name: k, rows: m[k] }));
  }, [rows]);

  const hierarchyTree = useMemo(() => {
    const nodes = {};
    hierarchyRows.forEach((r) => {
      nodes[r.side] = { name: r.side, sidemal: r.sidemal, funksjon: r.funksjon, children: [] };
    });
    const roots = [];
    hierarchyRows.forEach((r) => {
      const node = nodes[r.side];
      const parent = r.morside && nodes[r.morside];
      if (parent) parent.children.push(node);
      else roots.push(node);
    });
    return roots;
  }, [hierarchyRows]);

  const EKSTERN = "Ekstern henvisning";

  const tjenesteFacets = useMemo(() => {
    const uniq = (vals) => [...new Set(vals.filter(Boolean))].sort((a, b) => a.localeCompare(b, "nb"));
    return {
      kategorier: uniq(tjenesteRows.map((r) => r.tjenestekategori)),
      poststeder: uniq(tjenesteRows.map((r) => r.poststed)),
      virksomheter: uniq(tjenesteRows.map((r) => r.virksomhet || EKSTERN)),
    };
  }, [tjenesteRows]);

  const filteredTjenester = useMemo(() => {
    const q = tjSok.trim().toLowerCase();
    return tjenesteRows.filter((r) => {
      if (q) {
        const hay = `${r.tjeneste} ${r.tjenestekategori} ${r.virksomhet}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (tjKategori.length && !tjKategori.includes(r.tjenestekategori)) return false;
      if (tjPoststed.length && !tjPoststed.includes(r.poststed)) return false;
      if (tjVirksomhet.length && !tjVirksomhet.includes(r.virksomhet || EKSTERN)) return false;
      return true;
    }).sort((a, b) => a.tjeneste.localeCompare(b.tjeneste, "nb"));
  }, [tjenesteRows, tjSok, tjKategori, tjPoststed, tjVirksomhet]);

  const toggleFacet = (setFn) => (value) => {
    setFn((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const byKomponent = useMemo(() => {
    const m = {};
    rows.forEach((r) => {
      if (!r.komponent) return;
      (m[r.komponent] = m[r.komponent] || []).push(r);
    });
    return komponenter.ordered
      .filter((k) => m[k])
      .map((k) => ({ name: k, rows: m[k] }));
  }, [rows, komponenter]);

  const pillStyle = (komponent) => {
    if (komponent === "Unikt" || !komponent) {
      return { border: "1px dashed #B4B2A9", color: "#5F5E5A", background: "transparent" };
    }
    if (NEUTRAL.includes(komponent)) {
      return { background: "#F1EFE8", color: "#444441" };
    }
    const c = komponenter.colors[komponent];
    return c ? { background: c[0], color: c[1] } : { background: "#F1EFE8", color: "#444441" };
  };

  const uavklart = (r) => (r.status || "").toLowerCase().startsWith("uavkl");

  const tooltip = (r) => {
    if (!r) return undefined;
    const parts = [];
    if (r.type) parts.push(`Type: ${r.type}`);
    if (r.kommentar) parts.push(r.kommentar);
    if (r.status) parts.push(`Status: ${r.status}`);
    return parts.length ? parts.join("\n") : undefined;
  };

  const Pill = ({ children, style, flag, tip }) => (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs leading-5 whitespace-nowrap ${
        tip ? "cursor-help underline decoration-dotted decoration-current/40 underline-offset-2" : ""
      }`}
      style={style}
      title={tip}
    >
      {children}
      {flag && <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-60" />}
    </span>
  );

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium tracking-tight">Innholdsmodell for nye signo.no</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {updated ? `Hentet ${updated.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })} fra ` : "Henter fra "}
              <a href={SHEET_URL} target="_blank" rel="noreferrer" className="underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900">
                Google Sheets
              </a>
            </p>
          </div>
          <button
            onClick={load}
            disabled={status === "loading"}
            className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-2 text-[15px] font-medium text-neutral-900 hover:bg-neutral-100 disabled:opacity-60"
          >
            <RefreshCw size={18} className={status === "loading" ? "animate-spin" : ""} />
            {status === "loading" ? "Henter…" : "Oppdater"}
          </button>
        </header>

        <div className="mb-8 flex gap-6 border-b border-neutral-200">
          {[
            ["sidetype", "Innholdstyper"],
            ["komponent", "Komponenter"],
            ["hierarki", "Sidehierarki"],
            ["tjenesteoversikt", "Tjenesteoversikt"],
            ["eksempel", "Eksempelinnhold"],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setView(k)}
              className={`-mb-px border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                view === k
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {status === "error" && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            Kunne ikke hente arket: {error}.{" "}
            <button onClick={load} className="underline">
              Prøv igjen
            </button>
          </div>
        )}

        {status === "loading" && rows.length === 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl border border-neutral-100 bg-neutral-50" />
            ))}
          </div>
        )}

        {rows.length > 0 && view === "sidetype" && (
          <>
          <h2 className="mb-1 text-lg font-medium">Innholdstyper</h2>
          <p className="mb-5 text-sm text-neutral-600">
            {(() => {
              const names = bySidetype.map((g) => g.name);
              const objs = names.filter((n) => /\*\s*$/.test(n)).length;
              const pages = names.filter((n) => !/\*\s*$/.test(n) && !/^global/i.test(n)).length;
              return `Innholdsmodellen består av ${pages} sidetyper og ${objs} innholdsobjekter. Objektene har ikke egen side, men opprettes én gang og brukes fra sidene. Fargen på hvert felt viser hvilken komponent det tilhører, mens stiplede felt enten ikke er avklart ennå eller bare brukes ett sted.`;
            })()}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bySidetype.map((g) => {
              const isObj = /\*\s*$/.test(g.name);
              const label = g.name.replace(/\*\s*$/, "").trim();
              return (
              <section key={g.name} className={`rounded-xl border p-4 ${isObj ? "border-dashed border-neutral-300 bg-neutral-50" : "border-neutral-200"}`}>
                <h3 className="mb-3 flex items-center gap-2 text-[15px] font-medium">
                  {label}
                  {isObj && (
                    <span className="rounded-full border border-neutral-300 px-2 py-0.5 text-[11px] font-normal text-neutral-500">
                      innholdsobjekt
                    </span>
                  )}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {g.rows.map((r, i) =>
                    r.felt ? (
                      <Pill key={i} style={pillStyle(r.komponent)} flag={uavklart(r)} tip={tooltip(r)}>
                        {r.felt}
                      </Pill>
                    ) : (
                      <Pill key={i} style={pillStyle("Unikt")} flag={uavklart(r)} tip={tooltip(r)}>
                        Ikke definert
                      </Pill>
                    )
                  )}
                </div>
              </section>
              );
            })}
          </div>
          </>
        )}

        {rows.length > 0 && view === "komponent" && (
          <>
          <h2 className="mb-1 text-lg font-medium">Komponenter</h2>
          <p className="mb-5 text-sm text-neutral-600">
            Hver farge er én gjenbrukbar komponent leverandøren må bygge — jo flere innholdstyper og felt den dekker, jo mer lønner gjenbruket seg.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {byKomponent.map((g) => {
              const c = pillStyle(g.name);
              return (
                <section
                  key={g.name}
                  className="rounded-xl p-4"
                  style={{
                    background: c.background === "transparent" ? "#FAFAF8" : c.background,
                    border: c.border || "1px solid transparent",
                  }}
                >
                  <h3 className="mb-0.5 text-[15px] font-medium" style={{ color: c.color }}>
                    {g.name}
                  </h3>
                  <p className="mb-3 text-xs" style={{ color: c.color, opacity: 0.7 }}>
                    {(() => {
                      const n = g.rows.length;
                      const s = new Set(g.rows.map((r) => r.sidetype)).size;
                      return `${n} ${n === 1 ? "gang" : "ganger"} i bruk på ${s} ${s === 1 ? "innholdstype" : "innholdstyper"}`;
                    })()}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {g.rows.map((r, i) => (
                      <Pill
                        key={i}
                        style={{ background: "rgba(255,255,255,0.75)", color: "#2C2C2A" }}
                        flag={uavklart(r)}
                        tip={tooltip(r)}
                      >
                        {r.sidetype.replace(/\*\s*$/, "").trim()}
                        {r.felt && r.felt !== g.name && (
                          <span className="text-neutral-500">· {r.felt}</span>
                        )}
                      </Pill>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
          </>
        )}

        {rows.length > 0 && view === "tjenesteoversikt" && (
          <>
          <h2 className="mb-1 text-lg font-medium">Tjenesteoversikt</h2>
          <p className="mb-5 text-sm text-neutral-600">
            Prototype av Tjenesteoversikt-sidetypen, bygget på den reelle tjenestelisten — for å teste om søk og filter (kategori, poststed, virksomhet) faktisk fungerer.
          </p>

          <input
            type="text"
            value={tjSok}
            onChange={(e) => setTjSok(e.target.value)}
            placeholder="Søk i tjenester …"
            className="mb-4 w-full max-w-sm rounded-md border border-neutral-300 px-3 py-2 text-[15px] placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />

          {[
            ["Kategori", tjenesteFacets.kategorier, tjKategori, toggleFacet(setTjKategori)],
            ["Poststed", tjenesteFacets.poststeder, tjPoststed, toggleFacet(setTjPoststed)],
            ["Virksomhet", tjenesteFacets.virksomheter, tjVirksomhet, toggleFacet(setTjVirksomhet)],
          ].map(([label, options, active, toggle]) => (
            <div key={label} className="mb-3">
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</div>
              <div className="flex flex-wrap gap-1.5">
                {options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => toggle(opt)}
                    className={`rounded-md px-2.5 py-1 text-xs leading-5 transition-colors ${
                      active.includes(opt)
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <p className="mb-4 mt-5 text-sm text-neutral-500">
            {filteredTjenester.length} av {tjenesteRows.length} tjenester
          </p>

          <ul className="space-y-2">
            {filteredTjenester.map((r, i) => {
              const isEkstern = !r.virksomhet && !r.poststed;
              return (
                <li
                  key={i}
                  className={`rounded-lg border px-3 py-2.5 ${isEkstern ? "border-dashed border-neutral-300 bg-neutral-50" : "border-neutral-200"}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {r.lenke ? (
                      <a
                        href={r.lenke}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[15px] font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900"
                      >
                        {r.tjeneste}
                      </a>
                    ) : (
                      <span className="text-[15px] font-medium text-neutral-900">{r.tjeneste}</span>
                    )}
                    {isEkstern && (
                      <span className="rounded-full border border-neutral-300 px-2 py-0.5 text-[11px] font-normal text-neutral-500">
                        Ekstern henvisning
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {[r.tjenestekategori, r.malgruppe, r.virksomhet, r.poststed].filter(Boolean).join(" · ")}
                  </p>
                </li>
              );
            })}
          </ul>
          </>
        )}

        {view === "eksempel" && <ExampleContent />}

        {rows.length > 0 && view === "hierarki" && (
          <>
          <h2 className="mb-1 text-lg font-medium">Sidehierarki</h2>
          <p className="mb-5 text-sm text-neutral-600">
            Hvordan sidene henger sammen i navigasjonen, og hvilken sidemal hver side bruker.
          </p>
          {hierarchyTree.length > 0 ? (
            <ul className="space-y-2">
              {hierarchyTree.map((root) => (
                <TreeNode key={root.name} node={root} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">Fant ingen rader i hierarki-arket.</p>
          )}
          </>
        )}

        {rows.length > 0 && (
          <footer className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-neutral-500">
            {komponenter.ordered.map((k) => {
              const s = pillStyle(k);
              return (
                <span key={k} className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={s} />
                  {k}
                </span>
              );
            })}
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-neutral-500" />
              uavklart
            </span>
          </footer>
        )}
      </div>
    </div>
  );
}
