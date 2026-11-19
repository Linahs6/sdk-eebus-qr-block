# EEBUS-QR-Code Scanner – Custom Journey Block

Web Component für epilot Journeys (Custom Block, `@epilot/epilot-journey-sdk`).
Der Kunde/Installateur scannt den EEBUS-QR-Code eines Geräts (Wallbox, Wärmepumpe, EMS, Speicher …),
der Block zerlegt ihn und gibt die Werte als ein Objekt an die Journey zurück.

## Einbinden im Journey Builder

| Einstellung | Wert |
|---|---|
| Tag-Name | `epilot-eebus-qr-scanner` |
| Bundle-URL | gehostete `dist/bundle.js` (HTTPS) |

Optionen (Args, alle optional):

| Key | Bedeutung | Default |
|---|---|---|
| `title` | Überschrift im Block | „EEBUS-QR-Code scannen“ |
| `hint` | Hilfetext unter der Überschrift | Hinweis zum Typenschild |
| `allow_manual` | `false` blendet die manuelle SKI-Eingabe aus | `true` |
| `allow_edit` | `false` macht Hersteller/Modell/Typ/Seriennr. schreibgeschützt | `true` |

## Erfassungswege

1. **Kamera-Scan** (Live-Video, nativer `BarcodeDetector` oder jsQR als Fallback, z. B. iOS Safari)
2. **Foto hochladen** – öffnet auf dem Handy direkt die Kamera; funktioniert auch, wenn die Journey
   in einem iFrame ohne `allow="camera"` eingebettet ist
3. **Manuell** – SKI abtippen (z. B. aus der Web-Oberfläche des Geräts)

## Ausgabe (Wert des Blocks)

```json
{
  "ski": "A80556A243F57CA17B0D577A59B711B79EB4856C",
  "ski_formatted": "A805 56A2 43F5 7CA1 7B0D 577A 59B7 11B7 9EB4 856C",
  "ship_id": "i:983327_u:C8277H008F-3",
  "brand": "EXAMPLEBRAND",
  "device_type": "EMS",
  "model": "EEB01devA814",
  "serial_number": "C8277H008F-3",
  "category": "2",
  "category_label": "Energiemanagementsystem (EMS)",
  "fingerprint": "C74B7855D3479415F62CC01E5F6D9A93EBC676057D85417ADA16FD1384338943",
  "source": "qr_scan",
  "captured_at": "2026-11-19T12:00:00.000Z"
}
```

Das Pairing-Geheimnis `SPSEC` aus dem QR-Code wird **bewusst nicht** ausgegeben oder gespeichert.

## Unterstützte QR-Formate

- `SHIP;SKI:…;ID:…;BRAND:…;TYPE:…;MODEL:…;SERIAL:…;CAT:…;[FPH256:…;SPSEC:…;]ENDSHIP;`
  (SHIP 1.0.x und SHIP Pairing Service; Reihenfolge egal, Groß-/Kleinschreibung egal)
- `SKI=…,ShipID=…,Fingerprint=…`
- nur die SKI (40 Hex-Zeichen, mit/ohne Leerzeichen)

## Entwicklung

```bash
npm install
npm test          # Parser-Tests
npm run build     # -> dist/bundle.js
```

Demo: `python3 -m http.server 5179` im Projektordner, dann `http://localhost:5179/demo/`.
Kamera braucht HTTPS oder localhost.
