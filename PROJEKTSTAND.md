# Arbeitszeit-App – Projektstand / Übergabe

Letzte Pflege: 22.08.2026
Aktueller Stand: Version 1.4.4 Beta
Live-App: https://arbeitszeit-app-5kv.pages.dev/
Repository: gesasmc/arbeitszeit-app

## Zweck dieser Datei
Diese Datei ist die dauerhafte Übergabe für die Weiterentwicklung. Wenn die Arbeit nach Monaten oder Jahren fortgesetzt wird, zuerst diese Datei lesen und danach den aktuellen Stand des Repositories prüfen. Vor jeder Änderung einen Backup-Branch des funktionierenden `main` anlegen und die Versionsnummer erhöhen.

## Grundidee der App
Mobile Arbeitszeit-App, hauptsächlich für iPhone/PWA. Die App dient zur Erfassung und Auswertung der persönlichen Arbeitszeit und erzeugt einen Arbeitszettel/PDF. Bedienung und Darstellung sollen einfach, app-ähnlich und auf dem iPhone gut nutzbar sein.

## Wichtige Regeln für zukünftige Änderungen
1. Vor JEDEM größeren Eingriff einen Backup-Branch vom funktionierenden `main` erstellen.
2. Funktionierenden Arbeitszettel/PDF nicht unnötig neu aufbauen oder verändern.
3. Änderungen möglichst isoliert durchführen; keine funktionierenden Bereiche anfassen, wenn es nicht nötig ist.
4. Versionsnummer bei Änderungen erhöhen und in der App unter „Mehr“ sichtbar halten.
5. iPhone/PWA-Verhalten immer berücksichtigen. Seiten-Zoom ist deaktiviert.
6. Bestehende Arbeitszeitdaten niemals ohne ausdrücklichen Grund überschreiben oder löschen.
7. Importe und riskante Datenänderungen vorher sichern.

## Aktuelle Funktionen
- Übersicht mit Arbeitszeiterfassung.
- Wochenübersicht mit Angerechnet, Soll, Plus/Minus, Schlechtwetter und Verdienst.
- Wochen-Navigation über Pfeile.
- Zwischen den Pfeilen Anzeige im Stil `KW xx · TT.MM. – TT.MM.`.
- Button „Aktuelle Woche“, der direkt zur laufenden Woche springt.
- Kalenderansicht.
- Arbeitszeit-Einträge mit Datum, Beginn, Ende, Pause und Notiz.
- Schlechtwetter-Erfassung.
- Stundenlohn / Verdienst.
- Urlaub, Krankheit und Feiertage.
- Soll-Arbeitszeit mit zeitlicher Gültigkeit.
- CSV-Export / Wochenbericht.
- Arbeitszettel/PDF mit Download-Funktion.
- AtWork-Import für den konkreten Text/CSV-Export des Nutzers. Das Format enthält u. a. `Beginn`, `Ende`, `Dauer`, `Notiz`; Datum steckt in Beginn/Ende. Vor Import wird gesichert und vorhandene Tage werden nicht überschrieben.
- Optionale wöchentliche lokale Backups. Wenn aktiviert, wird spätestens nach 7 Tagen beim nächsten Öffnen ein Backup erzeugt; die letzten 8 werden behalten. Zusätzlich manuelles Backup und Download des letzten Backups.
- Hessische gesetzliche Feiertage werden automatisch berechnet/eingetragen. Dazu gehören Neujahr, Karfreitag, Ostermontag, 1. Mai, Christi Himmelfahrt, Pfingstmontag, Fronleichnam, Tag der Deutschen Einheit sowie 1. und 2. Weihnachtsfeiertag. Keine automatischen Einträge für Heiligabend, Silvester, Rosenmontag etc.
- PWA/iPhone-Homescreen-Unterstützung und App-Icon.
- Seiten-Zoom auf dem iPhone deaktiviert.

## Arbeitszettel / PDF – besonders wichtig
Der Arbeitszettel war während der Entwicklung mehrfach problematisch. Der aktuelle funktionierende Stand soll als Referenz gelten und nicht ohne Not ersetzt werden. Gewünschtes Grundlayout: klassischer Arbeitszettel mit Kopfbereich, Zeitraum, Mitarbeiter/Ort, Wochentagen Montag bis Samstag, Datum, „Bei wem gearbeitet“, „Art der Arbeit“, Einzel-/Gesamtstunden und Gesamtsumme. Der Briefkopf/Logo-Bereich wurde letztlich weggelassen, nachdem die Bild-/Layoutintegration Probleme gemacht hatte. PDF-Download soll möglichst direkt die iPhone-Speicher-/Teilen-Funktion ermöglichen und nicht eine anders formatierte Ersatzseite erzeugen.

## UI-Wünsche / aktueller Stil
- Optik wie eine richtige moderne iPhone-App.
- Große klare Schaltflächen, Karten und dezente helle Oberfläche.
- Übersicht und Arbeitszeiterfassung sollen schnell erreichbar sein.
- Keine unnötige zusätzliche Startseite; relevante Informationen gehören in die Übersicht.
- Wochenanzeige und Navigation kompakt halten.
- Versionsnummer sichtbar unter „Mehr“.

## Datenhaltung
Die App nutzt derzeit Browser/localStorage. Relevante Keys im Code sind unter anderem:
- `arbeitszeit-app-v2` – Einträge
- `arbeitszeit-app-active-v1` – aktiver Eintrag
- `arbeitszeit-app-settings-v1` – Einstellungen
Zusätzlich existieren Keys für Import- und Wochen-Backups. Bei Änderungen an Datenstrukturen unbedingt Abwärtskompatibilität und vorhandene Nutzerdaten beachten.

## Deployment
Live läuft die App über Cloudflare Pages:
https://arbeitszeit-app-5kv.pages.dev/

Das GitHub-Repository ist die Quelle für den Stand. Änderungen auf `main` können das Deployment auslösen. Nach Änderungen deshalb Live-Version kontrollieren.

## Versionsstand
Aktuell dokumentierter Stand: **1.4.4 Beta**.

Bei jeder zukünftigen Version diese Datei ebenfalls aktualisieren: Versionsnummer, neue Funktionen, wichtige Entscheidungen und bekannte Probleme.

## Einstieg bei einer späteren Fortsetzung
Wenn der Nutzer später sagt: „Mach bei der Arbeitszeit-App weiter“, dann:
1. `PROJEKTSTAND.md` lesen.
2. `VERSION.txt` und aktuellen `main` prüfen.
3. Live-App nicht blind verändern.
4. Backup-Branch vom aktuellen funktionierenden Stand erstellen.
5. Erst dann die gewünschte Änderung umsetzen.

## Aktueller Status
Die App wird zunächst im Alltag getestet. Stand 22.08.2026 gibt es keine weitere offene gewünschte Funktion. Neue Auffälligkeiten sollen auf Basis dieses funktionierenden Stands behoben werden.