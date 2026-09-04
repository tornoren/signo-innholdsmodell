# Innholdsmodell for nye signo.no

Frontend som viser innholdsmodellen live fra et publisert Google-ark.

## Datakilde

Arket er publisert som CSV (Fil → Del → Publiser på nettet). Adressen ligger i `CSV_URL` i `src/App.jsx`. Endringer i arket dukker opp i visningen etter noen minutter (Google cacher publiserte ark). Trykk «Oppdater» for å hente på nytt.

Arket må ha en overskriftsrad med kolonnene Innholdstype, Feltnavn, Komponent, Type, Kommentar og Status. Rekkefølgen spiller ingen rolle, og kolonnenavn gjenkjennes på starten av ordet.

## Kjøre lokalt

```
npm install
npm run dev
```

## Publisere på Vercel

1. Legg prosjektet i et GitHub-repo.
2. Gå til vercel.com, velg «Add New Project» og pek på repoet.
3. Vercel gjenkjenner Vite automatisk. Trykk Deploy.

Hver push til main publiserer en ny versjon.
