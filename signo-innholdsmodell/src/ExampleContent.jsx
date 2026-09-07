import { load as parseYaml } from "js-yaml";

const files = import.meta.glob("./content/eksempelinnhold/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

const GROUP_LABELS = {
  artikkel: "Artikkel",
  virksomhet: "Virksomhet",
  tjeneste: "Tjeneste",
  tjenesteoversikt: "Tjenesteoversikt",
  sokeresultat: "Søkeresultat",
  kurs: "Kurs",
  forside: "Forside",
  person: "Person (innholdsobjekt)",
  sted: "Sted (innholdsobjekt)",
  aktivitet: "Aktivitet (innholdsobjekt)",
  kategori: "Kategori (innholdsobjekt)",
  globale: "Globale elementer",
};

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw.trim() };
  const [, yamlBlock, body] = match;
  const data = parseYaml(yamlBlock) || {};
  return { data, body: body.trim() };
}

function loadGroups() {
  const groups = {};
  for (const [path, raw] of Object.entries(files)) {
    const parts = path.split("/");
    const idx = parts.indexOf("eksempelinnhold");
    const slug = parts[idx + 1];
    const { data, body } = parseFrontmatter(raw);
    (groups[slug] = groups[slug] || []).push({ data, body });
  }
  return Object.entries(groups).map(([slug, examples]) => ({
    slug,
    label: GROUP_LABELS[slug] || slug,
    examples,
  }));
}

function FieldValue({ value }) {
  if (value == null || value === "") return null;

  if (Array.isArray(value)) {
    return (
      <ul className="list-disc space-y-1 pl-5 text-[15px] leading-6 text-neutral-800">
        {value.map((v, i) => (
          <li key={i}>{typeof v === "object" ? JSON.stringify(v) : v}</li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object") {
    // CTA-shaped object: { tittel, primaer, sekundaer }
    if ("primaer" in value) {
      return (
        <div className="space-y-1 text-[15px]">
          {value.tittel && <p className="font-medium text-neutral-900">{value.tittel}</p>}
          <p className="text-neutral-700">Primærknapp: {value.primaer}</p>
          {value.sekundaer && <p className="text-neutral-700">Sekundærknapp: {value.sekundaer}</p>}
        </div>
      );
    }
    return (
      <dl className="space-y-1 text-[15px]">
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="text-neutral-500">{k}:</dt>
            <dd className="text-neutral-800">{String(v)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return <p className="text-[15px] leading-6 text-neutral-800">{value}</p>;
}

function ExampleInstance({ data, body }) {
  const { tittel, navn, bodyfelt, ...rest } = data;
  const heading = tittel || navn;
  const bodyLabel = bodyfelt || "Riktekst";
  const bodyParagraphs = body ? body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) : [];

  return (
    <article className="border-t border-neutral-200 pt-6">
      {heading && <h4 className="mb-4 text-lg font-medium text-neutral-900">{heading}</h4>}
      <dl className="space-y-4">
        {Object.entries(rest).map(([felt, value]) => (
          <div key={felt}>
            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">{felt}</dt>
            <dd>
              <FieldValue value={value} />
            </dd>
          </div>
        ))}
        {bodyParagraphs.length > 0 && (
          <div>
            <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">{bodyLabel}</dt>
            <dd className="space-y-3 text-[15px] leading-6 text-neutral-800">
              {bodyParagraphs.map((p, i) => {
                const image = p.match(/^!\[(.*)\]\(.*\)$/);
                if (image) {
                  return (
                    <div key={i} className="border border-dashed border-neutral-300 px-3 py-2 text-sm italic text-neutral-500">
                      Bilde: {image[1]}
                    </div>
                  );
                }
                return <p key={i}>{p}</p>;
              })}
            </dd>
          </div>
        )}
      </dl>
    </article>
  );
}

export default function ExampleContent() {
  const groups = loadGroups();

  return (
    <div>
      <p className="mb-8 max-w-2xl text-sm text-neutral-500">
        Eksempelinnhold for designarbeid — ikke faktisk redaksjonelt innhold fra Signo. Hver side hentes fra en egen
        .md-fil under <code className="rounded bg-neutral-100 px-1 py-0.5">src/content/eksempelinnhold/</code>, ikke
        fra kildekoden.
      </p>
      {groups.length === 0 && (
        <p className="text-sm text-neutral-500">Fant ingen eksempelfiler i src/content/eksempelinnhold/.</p>
      )}
      {groups.map((group) => (
        <section key={group.slug} className="mb-12">
          <h3 className="mb-4 text-base font-semibold text-neutral-900">{group.label}</h3>
          <div className="space-y-8">
            {group.examples.map((ex, i) => (
              <ExampleInstance key={i} data={ex.data} body={ex.body} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
