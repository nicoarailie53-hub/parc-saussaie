# AGENTS.md — Harta codului

## Prezentare

Aplicație web single-file (fără build, fără dependențe) pentru exploatarea Parcului de la Saussaie.

- **`index.html`** — aplicația completă (HTML + CSS + JS inline). Punct de intrare.
- **`parc.html`** — copie identică, pentru acces direct prin `/parc.html`.
- **`AGENTS.md`** — această hartă.

> `index.html` și `parc.html` trebuie păstrate identice. După orice modificare: `Copy-Item index.html parc.html -Force`.

## Harta fișierului (index.html)

| Linii | Zonă | Rol |
|---|---|---|
| 1–318 | `<style>` | Design system: culori (`--green #1E4D3B`, `--cream`, `--orange #E8712A`), layout responsiv, carduri, status pills, nav fixă jos, modal, toast, print. |
| 319–340 | `header.app-header` | Titlu, brand mark și butoanele **Export / Import JSON**. |
| 341–363 | `#tab-sit` | Tab 1 — containerele `#sit-gates`, `#sit-levels`, `#sit-elevators`, `#sit-acti`. |
| 364–453 | `#tab-rond` | Tab 2 — formular main courante, dictare, foto, raport FR, checklist, istoric. |
| 454–476 | `#tab-cameras` | Tab 3 — containerele `#cam-zone-a`, `#cam-zone-b`, `#cam-zone-c` + linkuri DMSS/Imou/go2rtc. |
| 477–493 | `#tab-rdv` | Tab 4 — alerte RDV, lista `#rdv-list`, repertoriul `#agents-list`. |
| 494–524 | `#tab-meteo` | Tab 5 — `#weather-box`, unelte backup/reset. |
| 525–552 | `nav.nav` | Meniul fix cu 5 tab-uri (`data-tab`: sit / rond / cameras / rdv / meteo). |
| 553–565 | `#modal`, `#toast`, `#import-file` | Modal generic, notificări, input fișier import. |
| 566–1442 | `<script>` | Toată logica aplicației (detaliat mai jos). |

## Harta JavaScript

### Constante și configurație (572–651)
- `STORAGE_KEY` = `regisseur-parc-saussaie-v1`.
- `STATUS_OPTIONS`, `DOOR_OPTIONS` — statusuri echipamente / porți secționale.
- `ZONES` — selectorul exact al zonei cu traducere `ro` → `fr` pentru raport.
- `LEVELS` (SS, RDC, E1–E4), `CHECK_ITEMS`, `AGENT_CATEGORIES`, `CAMERAS`, `AGENT_SEED`.

### Stare și persistență (652–723)
- `defaultState()` — shape-ul complet: `equipment`, `roundDraft`, `rounds`, `checklist`, `cameras`, `rdv`, `agents`, `weather`, `ui`.
- `loadState()` / `deepMerge()` — încarcă și completează datele vechi cu câmpurile noi.
- `saveState(immediate)` — debounce 350 ms → `localStorage`; actualizează `#last-saved`.

### Utilitare (724–797)
- `getPath` / `setPath` — binding prin string (`equipment.gates.pc1.status`).
- `esc`, `uid`, `todayStr`, `fmtDate`, `toast`.
- `statusPill`, `statusSelect`, `icon` — componente UI.
- `openModal(title, fields, onConfirm, label)` / `modalValues()` — formular generic.

### Navigare și binding (798–832)
- `switchTab(id)` — schimbă panelul + tabul activ, persistă `ui.activeTab`.
- `handleBind` — ascultă `input`/`change` pe `[data-bind]` → `setPath` + `saveState` + `refreshStatusPills`.
-listener separat pentru `[data-check]` (checklistul zilnic).

### Tab 1 — Sit (833–926)
- `renderSit()` — generare completă: 4 porți exterioare, 6 niveluri (2 loturi × 400 m² + 4 tablouri TGBT de 200 m²), 2 ascensoare, 4 hale ACTI (7 m liber, 3 porți secționale 350×400 cm).
- `equipCard()`, `logButton()`, `logsBlock()` — card echipament + jurnal intervenții.
- `refreshStatusPills()` — sincronizează pill-ul cu `<select>`-ul de status.

### Tab 2 — Rond & raport FR (927–1088)
- `renderRondStatic()` — populatează selectorul `ZONES`, data/ora curente.
- `renderChecklist()` — resetează checklistul la schimbarea zilei.
- `renderRounds()` — istoric cu butoane raport/ștergere.
- `buildFrenchReport(d, photoName)` — formatare **Main Courante / Demande d’intervention**.
- `translateObservation(ro)` — dicționar de termeni RO → FR pentru constatare.
- `showReport(text)` — afișează raportul în `.report-out`.
- `toggleDictation()` — Web Speech API, `lang='ro-RO'`.
- `compressImage(file, max)` — redimensionează foto în dataURL JPEG (păstrează cota localStorage).

### Tab 3 — Camere (1089–1127)
- `renderCameras()` / `camCard()` / `lensBlock()` — Zona A (CH1–CH7 + Dublă Dahua panoramic/detaliu), Zona B (Dublă Imou FR fix/PTZ), Zona C (Imou RO Cam 1–3). Câmpuri IP + RTSP + capturi per obiectiv.

### Tab 4 — RDV & agenți (1128–1200)
- `renderRdv()` — alerte „azi/mâine”, lista RDV cu status, repertoriu agenți cu `<a href="tel:...">` verde.
- `rdvFields()` / `agentFields()` — schemele formularelor din modal.

### Tab 5 — Meteo & unelte (1201–1258)
- `WCODE`, `weatherIcon()` — coduri meteorologice OWM → iconițe.
- `fetchWeather()` — fetch Open-Meteo `lat=48.7745&lon=2.3536`, `timezone=Europe/Paris`.
- `renderWeather(w)` — alertă roșie când `wind_gusts_10m > 60 km/h` (porți 350×400 + arbori).
- `$fmt`, `dirName` — formatare număr și direcție vânt.

### Backup (1259–1287)
- `exportJSON()` — descarcă `regisseur-parc-saussaie-YYYY-MM-DD.json` cu `{_app, _exportedAt, data: state}`.
- `importJSON(file)` — parse + `deepMerge` + `renderAll()`.

### Dispatcher de acțiuni (1288–1431)
- Un singur listener `click` cu `switch(e.target.closest('[data-action]').dataset.action)`.
- Acțiuni: `export-json`, `import-json`, `print-view`, `reset-all`, `toggle-dictation`, `generate-report`, `save-round`, `copy-report`, `download-report`, `show-round-report`, `del-round`, `add-log`, `del-log`, `report-fault`, `add-rdv`, `edit-rdv`, `cycle-rdv`, `del-rdv`, `add-agent`, `edit-agent`, `del-agent`, `del-shot`, `fetch-weather`, `modal-cancel`, `modal-confirm`.
-Listeneri dedicați: foto rond (`#round-photo`) și capturi camere (`[data-shot]`).

### Init (1432–1442)
- `renderAll()` → toate funcțiile `render*` + restaurează tabul activ.
- `saveState(true)` la încărcare.

## Model de date (chei importante)

```
state.equipment.gates.{pc1,pc2,pc3,parking}.{status,logs[]}
state.equipment.levels.{SS,RDC,E1..E4}.{lotA.tenant,lotB.tenant,panels.TGBT1..4,logs[]}
state.equipment.elevators.{asc1,asc2}.{status,lastRevision,logs[]}
state.equipment.acti.{ACTI1..4}.{tenant,surface,doors.{d1,d2,d3},logs[]}
state.roundDraft.{date,time,zone,subzone,urgence,type,observation,photo,photoName}
state.rounds[] = {id,date,time,zone,subzone,urgence,type,observation,photo,photoName,report}
state.checklist = {date,items:{0..4:true}}
state.cameras.{ch1..ch7,dual-dahua,dual-imou-fr,cam1..3}.{ip,rtsp,notes,shots[]}
state.cameras.{dual-dahua,dual-imou-fr}.lens{1,2}.{ip,rtsp,notes,shots[]}
state.rdv[] = {id,date,time,location,firm,reason,status}
state.agents[] = {id,name,firm,specialty,phone,notes}
state.weather = {temp,feels,humidity,precip,code,wind,gusts,dir,time,updated}
state.ui.activeTab
```

## Convenții de întreținere

- **Nu adăuga comments** în cod (convenția proiectului); secțiunile sunt marcate doar prin linii `/* ==== */`.
- Orice câmp editabil nou: adaugă `data-bind="cale.catre.valoare"` în HTML generat de `render*`; bindingul e automat.
- Orice buton nou: adaugă `data-action="nume"` și un `case` în dispatcher.
- După adăugarea unui echipament: actualizează atât configul (ex. `ZONES`), cât și `defaultState()` — altfel `deepMerge` nu îl va avea în backupurile vechi.
- Test rapid după editare:
  ```powershell
  $h = Get-Content index.html -Raw
  $m = [regex]::Match($h, '(?s)<script>(.*?)</script>')
  Set-Content "$env:TEMP\opencode\check-parc.js" $m.Groups[1].Value -Encoding UTF8
  node --check "$env:TEMP\opencode\check-parc.js"
  Copy-Item index.html parc.html -Force
  ```
- Limba UI: română; raportul generat: franceză; codurile de stare: `functional | defect | maintenance` și `OK | Blocată | Necesită reglaj` (nu traduce aceste valori — sunt chei în state).

## Integrări externe

| Serviciu | Utilizare | Loc |
|---|---|---|
| Open-Meteo | vreme live + rafale | `fetchWeather()` |
| Web Speech API (`ro-RO`) | dictare constatare | `toggleDictation()` |
| `navigator.clipboard` | copiere raport FR | acțiunea `copy-report` |
| `input[type=file][capture=environment]` | foto telefon | rond + capturi camere |
| DMSS / Imou Life / go2rtc | linkuri rapide | Tab 3 |

## Tehnii vocale & note șantier (transferat din MEMORY.md)

- **Pipeline voce/audio:** STT local română în `config.yaml` — `stt.provider=local`, `stt.language=ro`, `stt.local.model=base`; faster-whisper 'base' descărcat la `~/.cache/huggingface/hub`, suportă `ro`. Voz: `tts.edge.voice` = `ro-RO-EmilNeural` (`tts.provider` = `edge`), setat prin `hermes config set`. Delivery notițe vocale: `text_to_speech` → `MEDIA: <path>` + tag `[[audio_as_voice]]`; platforma livrează ca voce/buletă pe WhatsApp.
- **Regula notițe vocale proiect:** când primești o notă vocală despre unul dintre proiectele (parc, ai, plante), copiază fișierul audio în folderul 'voci' al proiectului (cu dată/oră în nume), și ARATĂ-LÎ MI-AÎNCA ce ai înțeles din nota vocală înainte de a modifica orice cod.
- **Note șantier:** 'rez-de-chaussée' — notă finală șantier, înregistrată 2026-11-24 (nota inițială a șantierului a fost înlocuită).
- **Rule memorie (completează):**
