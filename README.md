# Quiz Master PWA 🧠

Eine vollständig offline-funktionsfähige Progressive Web App für Multiple-Choice-Quiz mit JSON-Datei-Unterstützung.

## ✨ Features

- **📱 Progressive Web App**: Installierbar wie eine native App
- **🔌 Offline-Funktionalität**: Vollständig funktionsfähig ohne Internetverbindung
- **📁 JSON-Upload**: Eigene Quiz-Fragen als JSON-Datei hochladen
- **💾 Lokale Speicherung**: IndexedDB mit localStorage-Fallback
- **🎯 Interaktive Quiz**: Multiple-Choice mit Erklärungen
- **⚙️ Einstellungen**: Fragen/Antworten mischen, Dunkles Design
- **📊 Fortschritt**: Live-Punktestand und Fortschrittsbalken
- **🌍 Responsive**: Optimiert für alle Geräte
- **🎨 Modernes Design**: Mobile-first, dark mode support

## 🚀 Installation

### Als PWA installieren:
1. Öffnen Sie die App in einem modernen Browser
2. Klicken Sie auf "Zur Startseite hinzufügen" (Chrome/Edge) oder das Installieren-Symbol
3. Die App wird wie eine native App installiert

### Lokal ausführen:
1. Alle Dateien in einen Webserver-Ordner kopieren
2. Über HTTP/HTTPS aufrufen (nicht file://)
3. Für lokale Entwicklung: `python -m http.server 8000` oder `npx serve`

## 📝 JSON-Format

Quiz-Fragen müssen in folgendem Format strukturiert sein:

```json
{
  "questions": [
    {
      "id": 1,
      "category": "Kategorie Name",
      "question": "Ihre Frage hier?",
      "options": [
        "Antwort A",
        "Antwort B", 
        "Antwort C",
        "Antwort D"
      ],
      "correct_answer": 0,
      "explanation": "Erklärung der richtigen Antwort (optional)"
    }
  ]
}
```

### Wichtige Hinweise:
- `correct_answer`: Index der richtigen Antwort (0-3)
- `options`: Genau 4 Antwortmöglichkeiten erforderlich
- `explanation`: Optional, aber empfohlen für besseres Lernen
- `id`: Eindeutige Nummer für jede Frage
- `category`: Themenbereich oder Kapitel

## 🔧 Funktionsweise

### Datenmanagement
- **IndexedDB**: Primäre Speicherung für Quiz-Dateien
- **localStorage**: Fallback und Einstellungen
- **Service Worker**: Offline-Caching und Background-Sync

### Quiz-Engine
- **Vanilla JavaScript**: Keine externen Abhängigkeiten
- **Modulare Struktur**: Getrennte Verantwortlichkeiten
- **State Management**: Lokale Zustandsspeicherung

### PWA-Features
- **App Shell**: Sofortiges Laden der Grundstruktur
- **Cache-First**: Bevorzugung lokaler Inhalte
- **Offline-Fallback**: Graceful Degradation ohne Internet

## 🎯 Verwendung

1. **Quiz starten**: 
   - Beispielfragen laden oder eigene JSON-Datei hochladen
   - "Quiz starten" klicken

2. **Fragen beantworten**:
   - Antwort auswählen und bestätigen
   - Erklärung lesen (falls vorhanden)
   - Zur nächsten Frage

3. **Ergebnisse**:
   - Punktestand und Prozentsatz
   - Quiz wiederholen oder neues starten

4. **Dateien verwalten**:
   - JSON-Dateien hochladen, anzeigen, löschen
   - Validierung und Vorschau

5. **Einstellungen**:
   - Erklärungen ein/ausschalten
   - Fragen/Antworten mischen
   - Dunkles Design aktivieren

## 📂 Dateistruktur

```
quizz app/
├── index.html              # Haupt-HTML-Datei
├── manifest.json           # PWA-Manifest
├── sw.js                   # Service Worker
├── offline.html            # Offline-Fallback-Seite
├── sample-quiz.json        # Beispiel-Quiz-Daten
├── css/
│   └── styles.css          # Haupt-Stylesheet
├── js/
│   ├── app.js              # Haupt-App-Logik
│   ├── quiz.js             # Quiz-Engine
│   └── storage.js          # Datenmanagement
└── icons/
    ├── icon-192x192.svg    # App-Icons
    └── icon-512x512.svg
```

## 🔧 Technische Details

### Browser-Unterstützung
- **Chrome/Edge**: Vollständige PWA-Unterstützung
- **Firefox**: Core-Funktionalität + Add to Home Screen
- **Safari**: PWA-Installation + lokale Speicherung
- **Mobile**: Optimiert für Touch-Bedienung

### Offline-Funktionalität
- **Service Worker**: Caching-Strategie cache-first
- **App Shell**: Sofortiges Laden der UI
- **Daten-Persistierung**: IndexedDB für Quiz-Inhalte
- **Graceful Degradation**: Funktioniert auch bei Speicher-Fehlern

### Performance
- **Lazy Loading**: Nur benötigte Ressourcen laden
- **Minimal Bundle**: Keine externen Bibliotheken
- **Efficient Caching**: Aggressive Caching-Strategie
- **Touch Optimized**: 44px Touch-Targets

## 🎨 Anpassung

### Design ändern:
```css
:root {
  --primary-color: #4f46e5;    /* Hauptfarbe */
  --secondary-color: #10b981;  /* Sekundärfarbe */
  /* Weitere CSS-Variablen in styles.css */
}
```

### Neue Features hinzufügen:
1. UI in `index.html` erweitern
2. Logik in entsprechende JS-Module einfügen
3. Styling in `styles.css` hinzufügen
4. Service Worker bei Bedarf anpassen

## 🐛 Bekannte Einschränkungen

- **Icon-Konvertierung**: SVG-Icons, PNG-Versionen für bessere Browser-Unterstützung empfohlen
- **iOS-Installation**: Manuelle Installation über Safari-Menü erforderlich
- **Große JSON-Dateien**: Browser-Speicherlimits beachten
- **Cross-Origin**: Muss über HTTP/HTTPS bereitgestellt werden

## 📚 Erweiterungsmöglichkeiten

- **Quiz-Historie**: Detaillierte Statistiken und Verlauf
- **Kategorien-Filter**: Quiz nach Themen filtern
- **Timer-Modus**: Zeitbegrenzung für Fragen
- **Multiplayer**: Lokale oder Online-Mehrspielermodi
- **Import/Export**: Backup und Wiederherstellung
- **Adaptive Schwierigkeit**: KI-basierte Fragenauswahl

## 🤝 Mitwirken

Diese App ist als Beispiel für moderne PWA-Entwicklung konzipiert:
- **Vanilla JavaScript**: Keine Framework-Abhängigkeiten
- **Progressive Enhancement**: Funktioniert auf allen Geräten
- **Offline First**: Priorität auf lokale Funktionalität
- **Accessible**: Keyboard-Navigation und Screen-Reader-freundlich

## 📄 Lizenz

Dieses Projekt ist als Bildungsressource und Vorlage für PWA-Entwicklung gedacht.
Frei verwendbar für Lern- und Entwicklungszwecke.

---

**Quiz Master PWA** - Lernen ohne Grenzen! 🎓✨
