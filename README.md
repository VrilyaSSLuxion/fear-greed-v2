# Fear & Greed – Testkopie (V2)

Testkopie der Seite https://vrilyassluxion.github.io/fear-greed/ mit dem neuen Bereich **Trading Tools**.

- Online: https://vrilyassluxion.github.io/fear-greed-v2/
- Die Kopie verändert die Live-Seite nicht. Fear & Greed und Heatmap lesen ihre Daten live von der Original-Seite
  (`/fear-greed/data/`), es gibt also keine zweite Datensammlung.
- Browser-Einstellungen der Kopie sind getrennt von der Live-Seite (Präfix `v2~`); beim ersten Öffnen werden die
  Live-Einstellungen einmal übernommen.
- `accounts/` zeigt die Profile (TradingView, YouTube); die Liste steht oben in `accounts/index.html`.
- `quellcode/` enthält den Quellcode der Desktop-Tools (z. B. Fib Overlay), damit andere daran weiterarbeiten können.
- `tools/tools.json` enthält alle Einträge (MetaTrader, TradingView, Desktop-Tools). Downloads liegen unter *Releases*.
