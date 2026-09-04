# Innholdsmodell for nye signo.no

En liten frontend som viser innholdsmodellen for nye signo.no direkte fra et Google-ark. Endrer du arket, endrer visningen seg.

Visningen har to perspektiver:

- **Innholdstyper** – ett kort per sidetype og innholdsobjekt, med feltene som fargede merkelapper
- **Komponenter** – ett kort per gjenbrukbar komponent, med oversikt over hvor den brukes

Hensikten er å se hvilke byggeklosser nettstedet faktisk består av, slik at en leverandør kan prise komponenter, ikke sider.

## Datakilde

Visningen leser et Google-ark som er publisert som CSV (Fil → Del → Publiser på nettet → CSV). Adressen ligger i `CSV_URL` øverst i `src/App.jsx`. Bytt den ut hvis arket flyttes eller publiseres på nytt.

Google cacher publiserte ark, så endringer kan ta noen minutter før de vises. Trykk «Oppdater» i visningen for å hente på nytt.

### Slik skal arket se ut

Én rad per felt, med disse kolonnene i overskriftsraden:

| Kolonne | Hva den betyr |
|---|---|
| Innholdstype | Siden eller objektet feltet ligger på. Legg til `*` etter navnet for innholdsobjekter uten egen side, f.eks. `Sted*` |
| Feltnavn | Navnet redaktøren ser i CMS-et |
| Komponent | Byggeklossen feltet er laget av. Samme navn = samme komponent = samme farge |
| Type | Hva som kan legges inn i feltet |
| Kommentar | Fritekst, vises som tooltip |
| Status | Skriv `Uavklart` for å markere åpne spørsmål |

Kolonnene kan stå i hvilken som helst rekkefølge og gjenkjennes på starten av navnet (`Felt`, `Feltnavn` og `Feltnavn (redaktør)` fungerer alle). Tomme rader over overskriften er greit.

### Hva som styrer visningen

- **Farger** tildeles automatisk per komponentnavn. Et nytt navn i Komponent-kolonnen gir en ny farge. `Tekstfelt`, `Standard` og `Globalt` vises grått og telles ikke som komponenter.
- **Stiplet ramme** på et kort betyr innholdsobjekt (stjerne i arket). Stiplet felt uten farge betyr tomt komponentnavn.
- **Prikk** etter et feltnavn betyr `Uavklart` i Status.
- **Prikket understrek** betyr at feltet har Type eller Kommentar – hold musen over for å lese.
- **Rekkefølge** på kortene følger rekkefølgen innholdstypene først dukker opp i arket.

## Kjøre lokalt

```
npm install
npm run dev
```

Åpne adressen Vite skriver ut (vanligvis http://localhost:5173).

## Publisere

Prosjektet er et vanlig Vite-prosjekt og kan publiseres hvor som helst som serverer statiske filer. Med Vercel:

1. Legg prosjektet i et GitHub-repo.
2. Gå til [vercel.com](https://vercel.com), velg **Add New Project** og pek på repoet.
3. Vercel gjenkjenner Vite automatisk. Trykk **Deploy**.

Hver push til `main` publiserer en ny versjon.

## Teknisk

- React 18 og Vite 5
- Tailwind CSS 4
- [PapaParse](https://www.papaparse.com/) for CSV
- [lucide-react](https://lucide.dev/) for ikoner

Ingen backend, ingen nøkler, ingen innlogging. Alt skjer i nettleseren.
