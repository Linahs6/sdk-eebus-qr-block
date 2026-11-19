# EEBUS-Werte ins Backend mappen

## Wo der Wert landet

Der Custom Block (`CustomBlockControl`) speichert sein Objekt in der Submission unter seinem Blocknamen:

```
submission.steps[<Schritt-Index>]['<Blockname>']
```

Beispiel: Block „EEBUS QR-Code“ im 3. Schritt → `submission.steps[2]['EEBUS QR-Code']`.

epilot erzeugt dafür automatisch eine Mapping-Zeile in `journey_data` (wie bei allen anderen Blöcken).
So ist es in bestehenden Journeys mit Custom Blocks konfiguriert (z. B. Org 16246023, 16581695, 20000450).
Damit steht das komplette Objekt auf der Opportunity/Bestellung, aber noch nicht in einzelnen Attributen.

## Einzelne Felder auf Attribute mappen

Die Mapping-Engine liest verschachtelte Pfade per `_copy`. Das wird bereits massenhaft genutzt,
z. B. `submission.steps[29]['Kontakt B2C - AntragstellerIn']['firstName']`.
Für den EEBUS-Block funktioniert das genauso. Im Automation-Schritt „Entität erstellen/bearbeiten“
→ erweiterter Modus (JSON) pro Attribut:

```json
[
  { "target": "vb_eebus_ski",          "operation": { "_copy": "submission.steps[2]['EEBUS QR-Code']['ski']" } },
  { "target": "vb_eebus_ship_id",      "operation": { "_copy": "submission.steps[2]['EEBUS QR-Code']['ship_id']" } },
  { "target": "vb_eebus_hersteller",   "operation": { "_copy": "submission.steps[2]['EEBUS QR-Code']['brand']" } },
  { "target": "vb_eebus_modell",       "operation": { "_copy": "submission.steps[2]['EEBUS QR-Code']['model']" } },
  { "target": "vb_eebus_geraetetyp",   "operation": { "_copy": "submission.steps[2]['EEBUS QR-Code']['device_type']" } },
  { "target": "vb_eebus_seriennummer", "operation": { "_copy": "submission.steps[2]['EEBUS QR-Code']['serial_number']" } },
  { "target": "vb_eebus_kategorie",    "operation": { "_copy": "submission.steps[2]['EEBUS QR-Code']['category_label']" } }
]
```

`steps[2]` und `'EEBUS QR-Code'` an Schritt-Index und Blockname der Journey anpassen.

## Anzulegende Attribute (Opportunity, Org 20000070)

In der Opportunity der Sandbox gibt es noch keine EEBUS-Felder. Vorschlag (Textfelder, Präfix wie im EA&VB-Blueprint):

| Attribut | Label | Quelle im Block |
|---|---|---|
| `vb_eebus_ski` | EEBUS SKI | `ski` |
| `vb_eebus_ship_id` | EEBUS SHIP-ID | `ship_id` |
| `vb_eebus_hersteller` | EEBUS Hersteller | `brand` |
| `vb_eebus_modell` | EEBUS Modell | `model` |
| `vb_eebus_geraetetyp` | EEBUS Gerätetyp | `device_type` |
| `vb_eebus_seriennummer` | EEBUS Seriennummer | `serial_number` |
| `vb_eebus_kategorie` | EEBUS Gerätekategorie | `category_label` |

Bei mehreren Geräten (z. B. Wallbox + Wärmepumpe) je Gerät einen Block und eigene Attribute,
z. B. `vb_waermepumpe_eebus_ski`, `vb_ladeeinrichtung_1_eebus_ski`.
