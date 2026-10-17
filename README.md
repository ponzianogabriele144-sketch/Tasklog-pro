# 📋 TaskLog Pro • Enterprise Activity Tracker

Web application aziendale sviluppata in **React** per la registrazione giornaliera delle attività lavorative, monitoraggio del tempo e reportistica tabellare organizzata con esportazione dati.

Progettata con un'interfaccia moderna e pulita, palette colori coordinata sul **rosso bordeaux corporate** (`#800020` / `#67001A`), icone monocromatiche vettoriali e pieno supporto **PWA per iPhone e Mac**.

*development by Gabriele Ponziano*

---

## 🔐 Credenziali di Accesso Riservate (Login Permanente)

L'applicazione include un sistema di autenticazione aziendale una tantum con persistenza permanente:

- **Username**: `Ponziano`
- **Password**: `1234`

> [!NOTE]
> **Nessuna Scadenza di Sessione**: il sistema memorizza le credenziali in `localStorage` e tramite cookie di sicurezza con durata estesa (10 anni). Una volta effettuato l'accesso sul tuo iPhone o Mac, rimarrai permanentemente autenticato senza dover più ripetere il login.

---

## ✨ Funzionalità Principali

1. **Modulo di Registrazione Attività Giornaliere:**
   - Selezione rapida della data (pulsanti dedicati *"Oggi"* e *"Ieri"*).
   - Gestione progetti/commesse aziendali con aggiunta al volo di nuovi progetti.
   - Titolo attività sintetico e area note/consegne estesa.
   - Categorizzazione tematica: *Sviluppo & IT, Consulenza, Meeting & Sync, Supporto Clienti, Revisione & QA, Amministrazione, Ricerca*.
   - Selettore ore lavorate con tasti di incremento rapido (`+15m`, `+30m`, `+1h`, `+2h`).
   - Priorità (*Bassa, Media, Alta, Urgente*) e stato di avanzamento (*Pianificata, In corso, In revisione, Completata*).
   - Assegnazione operatore/collaboratore.

2. **Report Tabellare Organizzato:**
   - Tabella interattiva con ordinamento dinamico per ogni colonna (Data, Progetto, Titolo, Ore, Priorità, Stato).
   - Barra di ricerca istantanea full-text (cerca per titolo, cliente, note, operatore).
   - Filtri a cascata per periodo (*Oggi, Questa settimana, Questo mese, Tutto*), progetto, stato e categoria.
   - Vista a schede compatte ottimizzata per iPhone (nessuno scorrimento orizzontale scomodo, layout stile app iOS nativa).
   - Azioni rapide per riga: *Visualizza Scheda Dettaglio, Modifica, Duplica Attività con 1 clic, Elimina con conferma*.

3. **Dashboard & Indicatori KPI:**
   - Conteggio ore totali lavorate per il periodo/filtro attivo.
   - Percentuale e barra visiva di avanzamento task completati.
   - Individuazione automatica della commessa principale (*Top Commessa*).
   - Calcolo della media ore giornaliere.

4. **Esportazione & Backup:**
   - **Esporta CSV / Excel**: file formattato con codifica UTF-8 BOM compatibile con Microsoft Excel, Google Fogli e Apple Numbers.
   - **Stampa / Salva in PDF**: layout cartaceo aziendale ottimizzato con intestazione bordeaux per invio a direzione o archiviazione.
   - **Backup JSON**: esportazione completa dei dati per sicurezza e migrazione.
   - **Dati Demo**: pulsante rapido per popolare l'app con attività aziendali di esempio realistiche.

5. **PWA & Offline First:**
   - Funziona offline grazie al Service Worker integrato (`sw.js`).
   - Icona bordeaux ad alta risoluzione su iPhone e splash screen dedicato.
   - Persistenza automatica locale con `localStorage` (nessun dato va perso ricaricando la pagina o chiudendo il browser).

---

## 📱 Come Installare l'App sul tuo iPhone

Hai a disposizione due modalità pratiche:

### 🌟 Metodo 1: Test Istantaneo Locale via QR Code (Stessa Rete Wi-Fi)

Non serve installare Node.js né configurare nulla:
1. Sul tuo Mac, apri il Terminale in questa cartella ed esegui:
   ```bash
   python3 run_app.py
   ```
2. Si aprirà automaticamente sul Mac la pagina con il **QR Code**:
   - Inquadra il QR Code con l'app **Fotocamera** del tuo iPhone (assicurati che il telefono sia connesso allo stesso Wi-Fi del Mac).
   - Tocca il banner giallo per aprire il link in **Safari**.
3. In Safari, tocca il tasto **Condividi** (il quadrato con la freccia verso l'alto ⎋ in basso al centro).
4. Scorri l'elenco e tocca **"Aggiungi alla schermata Home"** ➕, poi tocca **"Aggiungi"** in alto a destra.
5. **Pronto!** L'icona bordeaux di TaskLog Pro apparirà sulla schermata iniziale del tuo iPhone. Aprendola, funzionerà a schermo intero senza barre del browser.

---

### 🚀 Metodo 2: Pubblicazione su GitHub & GitHub Pages (Accessibile da Ovunque)

Per avere l'applicazione sempre disponibile sul tuo iPhone da qualsiasi rete (anche fuori casa o sotto rete dati 4G/5G):

1. **Crea un nuovo repository su GitHub:**
   - Vai su [github.com/new](https://github.com/new).
   - Nome repository consigliato: `tasklog-pro`.
   - Imposta la visibilità su **Public** e non aggiungere README o .gitignore (sono già pronti in locale).

2. **Collega ed effettua il push dal Terminale del tuo Mac:**
   ```bash
   cd "/Users/gabrieleponziano/Desktop/Antigravity/App test "
   git remote add origin https://github.com/TUO-USERNAME/tasklog-pro.git
   git branch -M main
   git push -u origin main
   ```
   *(Sostituisci `TUO-USERNAME` con il tuo effettivo nome utente GitHub)*.

3. **Attiva GitHub Pages:**
   - Nel tuo repository GitHub, clicca su **Settings** (in alto a destra).
   - Nel menu laterale sinistro, clicca su **Pages**.
   - Sotto **"Build and deployment" > "Branch"**, seleziona `main` e la cartella `/(root)`, poi clicca **Save**.
   - Entro 1-2 minuti, GitHub genererà il tuo link pubblico HTTPS:
     ```
     https://TUO-USERNAME.github.io/tasklog-pro/
     ```

4. **Installa sul tuo iPhone:**
   - Apri il link `https://TUO-USERNAME.github.io/tasklog-pro/` in **Safari** su iPhone.
   - Tocca **Condividi** (⎋) -> **"Aggiungi alla schermata Home"** ➕ -> **"Aggiungi"**.

---

## 🎨 Palette Cromatiche Corporate Bordeaux

| Elemento | Valore HEX / Token | Descrizione |
| :--- | :--- | :--- |
| **Bordeaux Profondo** | `#67001A` | Header, sfondi card executive, accenti |
| **Rosso Bordeaux Standard** | `#800020` | Icona monocromatica, badge PRO, bottoni primari |
| **Bordeaux Scuro** | `#4A0E17` | Gradienti, clip holder, bordi satinati |
| **Bordeaux Accento** | `#A31D45` | Hover, indicatori di stato urgente |
| **Dark Canvas** | `#020617` / `#09090b` | Sfondo ad alto contrasto per Dark Mode |
| **Slate Neutro** | `#334155` / `#64748B` | Testi secondari e bordi strutturali |

---

## 📂 Struttura del Progetto

```
TaskLog Pro /
├── index.html               # Entry point PWA con React e container DOM
├── app.js                   # Applicazione React completa (Stato, Form, Tabella, KPI, Export)
├── manifest.json            # PWA Manifest per installazione iOS/Android
├── sw.js                    # Service Worker per cache e supporto offline
├── run_app.py               # Launcher locale Python con QR Code per iPhone
├── install.html             # Pagina di supporto installazione con QR Code
├── assets/
│   └── icons/
│       ├── icon.svg         # Icona vettoriale monocromatica bordeaux
│       ├── icon-180.png     # Apple Touch Icon per iPhone (180x180)
│       ├── icon-192.png     # Icona standard PWA (192x192)
│       └── icon-512.png     # Icona ad alta risoluzione PWA (512x512)
├── .gitignore               # Configurazione file esclusi da git
└── README.md                # Documentazione ufficiale e guida per GitHub
```
