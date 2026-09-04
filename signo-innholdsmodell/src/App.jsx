import { useState, useEffect, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import Papa from "papaparse";

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

async function fetchRows() {
  const res = await fetch(`${CSV_URL}&t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Kunne ikke hente arket (${res.status})`);
  const text = await res.text();
  const parsed = Papa.parse(text, { skipEmptyLines: true });
  const data = parsed.data;

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

export default function App() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(null);
  const [view, setView] = useState("sidetype");

  const load = async () => {
    setStatus("loading");
    setError("");
    try {
      const r = await fetchRows();
      setRows(r);
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
    if (uavklart(r)) parts.push("Status: uavklart");
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
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-neutral-200 p-0.5 text-sm">
              {[
                ["sidetype", "Per sidetype"],
                ["komponent", "Per komponent"],
              ].map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setView(k)}
                  className={`rounded px-3 py-1.5 transition-colors ${
                    view === k ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={load}
              disabled={status === "loading"}
              className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-2 text-[15px] font-medium text-neutral-900 hover:bg-neutral-100 disabled:opacity-60"
            >
              <RefreshCw size={18} className={status === "loading" ? "animate-spin" : ""} />
              {status === "loading" ? "Henter…" : "Oppdater"}
            </button>
          </div>
        </header>

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
              return `Innholdsmodellen består av ${pages} sidetyper og ${objs} innholdsobjekter. Objektene har ikke egen side, men opprettes én gang og brukes fra sidene.`;
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
          <h2 className="mb-4 text-lg font-medium">Komponenter</h2>
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

        {rows.length > 0 && (
          <details className="mt-10 rounded-xl border border-neutral-200 p-4 text-sm leading-6 text-neutral-700">
            <summary className="cursor-pointer select-none font-medium text-neutral-900">Slik leser du visningen</summary>
            <div className="mt-3 space-y-3">
              <p>
                <span className="font-medium text-neutral-900">Farger.</span> Hver farge er én komponent, altså én gjenbrukbar byggekloss leverandøren må lage. Fargen bestemmes av verdien i Komponent-kolonnen i arket: felter med samme komponentnavn får samme farge, uansett hvilken innholdstype de ligger på. Skriver du et nytt komponentnavn, får det automatisk en ny farge. Tekstfelt og globale elementer er grå fordi de ikke krever en egen komponent.
              </p>
              <p>
                <span className="font-medium text-neutral-900">Innholdsobjekt.</span> Kort med stiplet ramme og merkelappen «innholdsobjekt» er innhold som ikke har egen side, men som opprettes én gang og brukes fra andre sider. Person, Sted, Aktivitet og Kategori er eksempler: redaktøren velger dem fra en liste i stedet for å skrive dem inn på nytt hver gang. I arket markeres de med stjerne etter navnet, for eksempel «Sted*».
              </p>
              <p>
                <span className="font-medium text-neutral-900">Stiplede felter.</span> Et felt med stiplet ramme og uten farge er noe som ikke er definert ennå, eller som bare brukes ett sted og derfor ikke er en komponent.
              </p>
              <p>
                <span className="font-medium text-neutral-900">Prikk og understrek.</span> En liten prikk etter feltnavnet betyr at raden er merket «Uavklart» i Status-kolonnen. Prikket understrek betyr at feltet har type eller kommentar i arket – hold musen over for å lese den.
              </p>
              <p>
                <span className="font-medium text-neutral-900">Rekkefølge.</span> Innholdstypene vises i den rekkefølgen de først dukker opp i arket. Flytt rader for å endre rekkefølgen, og trykk Oppdater.
              </p>
            </div>
          </details>
        )}

        {rows.length > 0 && (
          <footer className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-neutral-500">
            {komponenter.ordered.map((k) => {
              const s = pillStyle(k);
              return (
                <span key={k} className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={s} />
                  {k} · {komponenter.counts[k]}
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
