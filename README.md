# Compliance Compass

Du är en erfaren fullstack-utvecklare och expert inom integrerade ledningssystem (ISO 9001, ISO 14001 och ISO 45001). 

Hjälp mig att utveckla specifikationen, datastrukturen och användargränssnittet för ett webbaserat system för vårt ledningssystem. Systemets kärna ska vara ett interaktivt ÅRSHJUL och en MÅNADSAGENDA för efterlevnad, implementering och vidareutveckling.

### 1. BAKGRUND OCH KONTEXT

* **Verksamhetsstandarder:** Vi arbetar utifrån ISO 9001 (Kvalitet), ISO 14001 (Miljö) och ISO 45001 (Arbetsmiljö). Vi är inte certifierade än, men bygger för full efterlevnad.

* **Mål:** Systemet ska ersätta manuella Excel-ark och säkerställa att lagstadgade krav, ISO-krav och interna rutiner genomförs i tid med tydlig ansvarsfördelning.

### 2. KÄRNFUNKTIONER I SYSTEMET

#### A. Interaktivt Årshjul & Månadsagenda

* **Årshjul (Översikt):** En visuell cirkulär eller matrisbaserad vy uppdelad i 12 månader och 4 kvartal.

* **Månadsvy (Operativ):** Möjlighet att zooma in på aktuell månad för att se specifika aktiviteter, deadlines och tillhörande dokument/checklistor.

* **Kategorisering / Filtrering:**

  * ISO-standard (Kvalitet / Miljö / Arbetsmiljö / Gemensamt)

  * Aktivitetstyp (Revision, Riskbedömning, Ledningens genomgång, Utbildning, Skyddsrond, Lagbevakning, Mål-uppföljning)

  * Status (Ej påbörjad, Pågående, Klar, Försenad)

  * Ansvarig roll (t.ex. VD, KMA-ansvarig, Skyddsombud, Platschef)

#### B. Fördefinerad Årscykel (Standardmall ingår)

Inkludera följande återkommande ISO-moment i årshjulet:

* **Q1:** Lagbevakning & regelefterlevnadskontroll, Miljöinventering, Medarbetarsamtal, Översyn av KMA-policy.

* **Q2:** Internrevision (Kvalitet & Miljö), Skyddsrond (Vår/Sommar), Uppföljning av delmål Q1-Q2, Leverantörsutvärdering.

* **Q3:** Nödlägesöövning, Internrevision (Arbetsmiljö), Risk- och konsekvensanalys.

* **Q4:** Ledningens genomgång (Management Review), Årlig arbetsmiljökartläggning (SAM), Sätta nya KMA-mål för kommande år.

* **Månatliga rutiner:** Avvikelsehantering, skyddsronder/månadsuppföljningar, rapportering av tillbud/tillbud.

#### C. Uppgifts- & Avvikelsehantering

* Varje aktivitet i årshjulet ska kunna generera en **Uppgift** med ansvarig personenhet, deadline och påminnelser (e-post/notifiering).

* **Koppling till Avvikelser:** Möjlighet att logga avvikelser, tillbud och förbättringsförslag direkt kopplat till månadens moment.

#### D. Dashboard & Rapportering

* **Statusindikatorer (KPI:er):**

  * % genomförda årsaktiviteter i tid.

  * Öppna vs. stängda avvikelser.

  * Kommande deadlines inom 30 dagar.

* Exportfunktion för rapporter till Ledningens Genomgång (PDF/Excel).

### 3. DITT UPPDRAG NU

Skapa första steget i utvecklingen genom att ge mig:

1. **Systemarkitektur & Datamodell:** En överskådlig databasstruktur (t.ex. JSON-schema eller ER-diagram i text) för Aktiviteter, Användare, ISO-krav och Avvikelser.

2. **UI/UX-trådskiss (Wireframe):** Beskriv hur dashboarden och årshjulet ska se ut visuelt för användaren.

3. **Teknikstacksrekommendation:** Bästa teknikval för en snabb, säker och skalbar webbapplikation (Frontend, Backend, Databas).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://iso-wheel.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/12a5d82e-8c4a-48cb-a20f-89e9d0114d58).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
