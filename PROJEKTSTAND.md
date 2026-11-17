# Arbeitszeit-App – Projektstand / Übergabe

Letzte Pflege: 17.11.2026
Aktueller Stand: Version 1.5.5 Beta
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
Aktuell dokumentierter Stand: **1.5.5 Beta**.

Bei jeder zukünftigen Version diese Datei ebenfalls aktualisieren: Versionsnummer, neue Funktionen, wichtige Entscheidungen und bekannte Probleme.

## Einstieg bei einer späteren Fortsetzung
Wenn der Nutzer später sagt: „Mach bei der Arbeitszeit-App weiter“, dann:
1. `PROJEKTSTAND.md` lesen.
2. `VERSION.txt` und aktuellen `main` prüfen.
3. Live-App nicht blind verändern.
4. Backup-Branch vom aktuellen funktionierenden Stand erstellen.
5. Erst dann die gewünschte Änderung umsetzen.

## Aktueller Status
Stand 17.11.2026: Version 1.5.5 Beta ergänzt „Ganzer Tag“ bei Schlechtwetter. Ein solcher Tag wird mit 8,25 h netto abgeschlossen, ohne Start-/Endzeit. Urlaubszeiträume aus 1.5.4 und das PDF-Layout bleiben die Referenz.


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



## Stand 13.11.2026 – Version 1.5.4 Beta
- Auftrag: Urlaub von/bis ohne Wochenende eintragen; z. B. „Sommer 2027“ als zusammengehörigen Zeitraum speichern und komplett löschen können. Marco verlangt vor Änderungen ausdrücklich ein Backup.
- Quellcode-Backup: backup-before-vacation-groups-v1.5.4, aus dem funktionierenden main von 1.5.3 (a0b6bb01b45ac80e979b74b3e37014f755c5b65d).
- Ursache: Der separate Kalenderweg saveAbsence trug Wochenenden noch ein; der Editorweg übersprang sie bereits. Beide neuen Urlaubswege verwenden nun dieselbe Logik. Bereits belegte Tage, gesetzliche Feiertage und ein aktiver Arbeitseintrag werden übersprungen.
- Jeder neue ganztägige Urlaub erhält vacationGroupId, vacationGroupName, vacationGroupFrom und vacationGroupTo an seinen täglichen Einträgen. Gleiche Bezeichnungen werden durch eindeutige IDs getrennt. Bestehende Alt-Einträge werden nicht automatisch zusammengefasst oder gelöscht.
- Im Kalender stehen die „Urlaubszeiträume“ mit Name, Zeitraum, Urlaubstagezahl und „Gesamten Urlaub löschen“. Beim Bearbeiten eines zugehörigen Tages gibt es denselben Gruppen-Löschbutton zusätzlich zum einzelnen Löschen.
- Vor Gruppenlöschung wird die betroffene Gruppe unter arbeitszeit-app-vacation-delete-backup-v1 gesichert. „Letzten gelöschten Urlaub wiederherstellen“ stellt freie Tage wieder her und überschreibt keine inzwischen belegten Tage. Bei Sicherungs-/Speicherfehlern bleibt der Urlaub erhalten.
- Eine neue Eingabe übernimmt niemals das Bis-Datum des vorherigen Urlaubs. Vorschau zeigt die einzutragenden Urlaubstage. Das Urlaubskonto wird nach Speichern, Löschen und Wiederherstellen direkt aktualisiert.
- Stundenweiser Urlaub sowie Krankheit/Feiertage verwenden ihre bisherigen Regeln. Zeiterfassung und PDF-Code sind unverändert.
- Tests: TZ=Europe/Berlin node tests/vacation-logic.test.cjs. Zusätzlich tests/vacation.spec.cjs für Playwright-Browsertests (lokaler Testserver auf Port 8765, Playwright und Chromium erforderlich).


## Prüfung von 1.5.4
- Isolierte Tests bestanden: beide Speicherwege ohne Wochenenden, Überlappungen mit Arbeit/aktivem Eintrag, Urlaubskonto, gleichnamige getrennte Gruppen, Abbruch, Gruppenlöschung und Wiederherstellen, Feiertage, Jahreswechsel, Zeitumstellung und Speicherfehler.
- In der Browser-Vorschau beide Formulare geprüft: 10.–25.07.2027 ergibt 10 Urlaubstage. Eine neue Urlaubseingabe setzt Von/Bis auf denselben Tag zurück. Keine App-JavaScript-Fehler beobachtet.
- Der automatische Freigabecheck hat persistente Testbuchungen in der Browser-Vorschau abgelehnt. Speichern/Löschen wurde deshalb ausschließlich mit isolierten Testdaten geprüft; keine Testurlaube in Marcos produktiven Daten angelegt.
- Der lokale Playwright-Lauf ist in dieser Ausführungsumgebung durch gesperrte Chromium-Sockets blockiert. Der Test ist für eine Umgebung mit Browserzugriff unter tests/vacation.spec.cjs enthalten; er wurde hier nicht als bestanden gewertet.


## Stand 17.11.2026 – Version 1.5.5 Beta
- Auftrag: Schlechtwetter für den ganzen Tag antippen, 8,25 Stunden unter Berücksichtigung der Pause, direkt abschließen ohne Start- und Endzeit.
- Backup: backup-before-full-day-weather-v1.5.5 vom main 9860d1357a5915631c2e7b4c9aba2bcdefb3e005 (1.5.4).
- Bedienung: Arbeit → Schlechtwetter einschalten → Ganzer Tag → Sichern. Zeit- und Pausenfelder werden ausgeblendet; die Zusammenfassung zeigt 8,25 h netto und die bereits berücksichtigte Pause. Der Datensatz erhält completedAt und wird niemals als laufender Eintrag gestartet.
- Annahme ausdrücklich im Chat genannt: 8,25 h sind die Nettozeit nach der Pause. Die eingestellte beziehungsweise zuletzt verwendete Pause wird übernommen, bei fehlender Historie 30 Minuten. Der Bruttowert ist Nettozeit plus Pausenminuten, sodass die Pause nicht zweimal abgezogen wird.
- Modell: type work, leere start/end, badWeatherFullDay true, badWeatherNetMinutes 495, badWeatherGrossMinutes 495 + breakMinutes. Die Erkennung erfordert type work und leere Zeiten; normales Bearbeiten setzt den Marker zurück.
- Die Wochen-Gutschrift und Schlechtwetterzeit zählen jeweils 495 Minuten. Tatsächliche Arbeitszeit ist 0; eine gesonderte Schlechtwettervergütung wurde nicht angefragt und wird nicht erfunden. Übersicht/Kalender/CSV zeigen „Schlechtwetter – ganzer Tag“ statt leerer Zeiten. Im bestehenden Arbeitszettel wird nur die Schlechtwetterzeile mit 8,25 h befüllt; das Layout ist unverändert.
- Beim Ersetzen eines vorhandenen/laufenden Eintrags wird eine Bestätigung verlangt. Vor dem Schreiben liegt ein vollständiger Datenschnappschuss unter arbeitszeit-app-full-day-weather-backup-v1. Bei Fehlern bleiben die bisherigen Einträge und ein aktiver Tag erhalten; beim gezielten Abschließen wird der ausgewählte aktive Eintrag entfernt. Andere laufende/belegte Tage werden geschützt.
- Modul app14.js ergänzt die Oberfläche und das Speichern nach den bisherigen Erweiterungen. Die bestehenden Rechen-/Darstellungsfunktionen enthalten gezielte Abzweigungen für den neuen Tagestyp.
- Prüfungen: TZ=Europe/Berlin node tests/full-day-weather.test.cjs; TZ=Europe/Berlin node tests/vacation-logic.test.cjs; node tests/pdf-export.test.cjs (jetzt auch eine echte PDF mit 8,25-h-Schlechtwettertag).
- Browser-Speichertests bleiben gemäß vorheriger automatischer Ablehnung ausgenommen. Die Speicherlogik wird mit isolierten Testdaten geprüft; die Formularbedienung wird ohne Speichern in der Vorschau geprüft.
