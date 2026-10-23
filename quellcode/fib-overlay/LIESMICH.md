# Fib Overlay (SK-System) – Quellcode Version 6

Alles in einer Datei: `fib_overlay.py` (Python 3, PyQt5, nur für Windows).

## Starten ohne EXE

```
pip install -r requirements.txt
python fib_overlay.py
```

## EXE selbst bauen

```
pip install -r requirements.txt
python -m PyInstaller --noconfirm --clean FibOverlay.spec
```

Die fertige Datei liegt danach in `dist\FibOverlay.exe`.

## Gut zu wissen

- Gebaut und getestet mit Python 3.14, PyQt5 5.15.11, PyInstaller 6.22.3 unter Windows 11.
- Einstellungen, Vorlagen und Speicherplätze speichert das Programm unter `%APPDATA%\FibOverlay`.
- Aufbau der Datei (von oben nach unten): Windows-Funktionen (Hotkeys, Klick-durch, Bildschirm lesen),
  Einstellungen und Standardwerte (`SETUPS`, `TOOL_STYLES`, `FIB_LEVELS`, `THEMES`), Kerzen-Erkennung für Magnet und Alarm,
  danach die Fenster: `FibOverlay` (das durchsichtige Overlay mit Fibs und Zeichnungen), `DrawingDialog` (Eigenschaften),
  `ObjectListDialog` (Objektbaum), `SettingsPanel` (Einstellungen), `ControlPanel` (Dashboard), `main()`.
