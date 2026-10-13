# Arbeitszeit-App – Projektstand / Übergabe

Letzte Pflege: 13.10.2026
Aktueller Stand: Version 1.5.3 Beta
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
- Pause wird beim Einstellen in **5-Minuten-Schritten als Minutenwert** angezeigt (`0 Min.`, `5 Min.`, `10 Min.` ...); intern bleibt die Berechnung in Minuten und die Auswertung erfolgt weiterhin als Dezimalstunden.
- Schlechtwetter-Erfassung.
- Stundenlohn / Verdienst.
- Urlaub, Krankheit und Feiertage.
- **Urlaubskonto pro Jahr** unter „Mehr“: Jahresurlaub und Resturlaub aus dem Vorjahr können je Jahr hinterlegt werden. Genommener Urlaub wird automatisch aus den Urlaubseinträgen berechnet. Resturlaub vom Vorjahr wird zuerst verbraucht; angezeigt werden genommener Urlaub, verbliebener Vorjahresurlaub und Resturlaub gesamt.
- **Stundenweiser Urlaub**: Beim Urlaubseintrag kann optional „Stundenweise Urlaub“ aktiviert und eine Stundenzahl eingetragen werden. Die Gutschrift entspricht dann genau diesen Urlaubsstunden; für das Urlaubskonto wird der entsprechende Tagesanteil berechnet.
- Soll-Arbeitszeit mit zeitlicher Gültigkeit.
- CSV-Export / Wochenbericht.
- Arbeitszettel/PDF mit Download-Funktion. Dateiname enthält `Rodenbach` und den jeweiligen Wochenzeitraum.
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
- `arbeitszeit-app-vacation-settings-v1` – Urlaubskonto nach Jahr
Zusätzlich existieren Keys für Import- und Wochen-Backups. Bei Änderungen an Datenstrukturen unbedingt Abwärtskompatibilität und vorhandene Nutzerdaten beachten.

## Deployment
Live läuft die App über Cloudflare Pages:
https://arbeitszeit-app-5kv.pages.dev/

Das GitHub-Repository ist die Quelle für den Stand. Änderungen auf `main` können das Deployment auslösen. Nach Änderungen deshalb Live-Version kontrollieren.

## Versionsstand
Aktuell dokumentierter Stand: **1.5.3 Beta**.

Bei jeder zukünftigen Version diese Datei ebenfalls aktualisieren: Versionsnummer, neue Funktionen, wichtige Entscheidungen und bekannte Probleme.

## Einstieg bei einer späteren Fortsetzung
Wenn der Nutzer später sagt: „Mach bei der Arbeitszeit-App weiter“, dann:
1. `PROJEKTSTAND.md` lesen.
2. `VERSION.txt` und aktuellen `main` prüfen.
3. Live-App nicht blind verändern.
4. Backup-Branch vom aktuellen funktionierenden Stand erstellen.
5. Erst dann die gewünschte Änderung umsetzen.

## Aktueller Status
Stand 13.10.2026: Version 1.5.3 Beta behebt die zu breite PDF-Vorschau und den inaktiven Download-Button von 1.5.2. Der bisherige Arbeitszettel bleibt die Layout-Referenz. Änderungen an anderen Funktionen sind aktuell nicht beauftragt.


## Stand 13.10.2026 – Version 1.5.3 Beta
- Basis: 1.5.2 Beta, mit getrennten Eingaben „Bei wem gearbeitet“ und „Art der Arbeit“, mehrzeiligen Kundenangaben und Monatsverdienst.
- Behoben: Ein falsch maskierter Zeilenumbruch im erzeugten JavaScript des Arbeitszettels führte zu einem Syntaxfehler. Dadurch waren Bildschirm-Anpassung und PDF-Download ohne Funktion.
- Die A4-Vorschau passt sich jetzt über einen eigenen Container proportional an die verfügbare Breite an, auch nach Änderung der Ausrichtung. Der Container hat die tatsächliche skalierte Höhe.
- jsPDF 2.5.1 liegt unter vendor/ im Projekt und wird vom gleichen Ursprung geladen.
- Der Download wartet auf den bestehenden Speichern-/Teilen-Ablauf, bevor der Button wieder freigegeben wird. Bestehendes PDF-Layout und Datenformat werden beibehalten.
- Vorheriger Stand gesichert in backup-before-pdf-mobile-v1.5.3.
- Automatische Regression: node tests/pdf-export.test.cjs (Syntax des tatsächlich erzeugten Popup-Skripts, Hochformat-/Querformat-Skalierung, echte PDF-Erzeugung, Dateiname und Zeilenumbrüche).


## Prüfung von 1.5.3
- Erzeugtes Popup-JavaScript ohne Syntaxfehler; node tests/pdf-export.test.cjs erfolgreich.
- Echte PDF: eine A4-Seite, 595,28 × 841,89 pt, beide Kunden und beide Tätigkeitszeilen enthalten, Dateiname mit Rodenbach und Wochenzeitraum.
- Browserprüfung mit Beispieldaten über tests/pdf-mobile.html: 320 px, 390 px, 844 px sowie Drehen 390 → 844 → 390 px erfolgreich; vollständige proportionale Vorschau ohne horizontalen Überlauf.
- Download aus dem tatsächlichen separaten Arbeitszettel-Fenster im Browser erfolgreich.
- Direkt auf Marcos iPhone/Safari wurde die Version noch nicht durch den Nutzer bestätigt. Die vorhandene iOS-Speichern-/Teilen-Funktion wird weiterhin verwendet.
