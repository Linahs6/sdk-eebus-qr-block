/**
 * Parser für EEBUS-SHIP-QR-Codes.
 *
 * Format (SHIP-Spezifikation; Pairing-Felder aus "SHIP Pairing Service", Annex A.1):
 *   SHIP;SKI:<40 hex>;ID:<SHIP-ID>;BRAND:..;TYPE:..;MODEL:..;SERIAL:..;CAT:..;
 *        FPH256:<64 hex>;SPSEC:<hex>;ENDSHIP;
 *
 * - Felder sind durch ";" getrennt, Schlüssel und Wert durch das ERSTE ":" (Werte dürfen ":" enthalten).
 * - Reihenfolge ist egal, unbekannte Felder werden ignoriert.
 * - Pflicht für uns ist nur die SKI. Ältere Geräte (SHIP 1.0.x) liefern kein FPH256/SPSEC.
 * - SPSEC ist ein Pairing-Geheimnis und wird bewusst NICHT ausgegeben.
 */

export type EebusDeviceData = {
  /** Subject Key Identifier, 40 Hex-Zeichen, normalisiert (Großbuchstaben, ohne Leerzeichen). */
  ski: string
  /** SKI in der lesbaren 4er-Gruppierung, wie sie auf Typenschildern steht. */
  ski_formatted: string
  ship_id: string
  brand: string
  device_type: string
  model: string
  serial_number: string
  /** Rohwert aus CAT, z. B. "2" oder "3,4". */
  category: string
  /** Lesbare Bezeichnung(en) der Kategorie. */
  category_label: string
  /** SHA-256-Zertifikats-Fingerprint (FPH256 / BFPH256 / B2FPH256), falls vorhanden. */
  fingerprint: string
  /** Welche Quelle die Daten hatten. */
  source: 'qr_scan' | 'image_upload' | 'manual'
  /** ISO-Zeitstempel der Erfassung. */
  captured_at: string
}

export type ParseResult =
  | { ok: true; data: Omit<EebusDeviceData, 'source' | 'captured_at'> }
  | { ok: false; error: string }

/**
 * Gerätekategorien laut SHIP-Spezifikation (Feld CAT).
 * Bitte gegen die beim Netzbetreiber gültige Spezifikationsversion prüfen.
 */
export const EEBUS_CATEGORIES: Record<string, string> = {
  '1': 'Netzanschlusspunkt (Grid Connection Hub)',
  '2': 'Energiemanagementsystem (EMS)',
  '3': 'E-Mobilität (z. B. Wallbox)',
  '4': 'Heizung/Klima (z. B. Wärmepumpe)',
  '5': 'Wechselrichter / Speicher',
  '6': 'Haushaltsgerät',
  '7': 'Messeinrichtung',
}

const HEX = /^[0-9A-F]+$/

export function normalizeSki(input: string): string | null {
  const s = input.replace(/[\s:-]/g, '').toUpperCase()
  return s.length === 40 && HEX.test(s) ? s : null
}

export function formatSki(ski: string): string {
  return ski.match(/.{1,4}/g)?.join(' ') ?? ski
}

function categoryLabel(cat: string): string {
  if (!cat) return ''
  return cat
    .split(/[,\s]+/)
    .filter(Boolean)
    .map((c) => EEBUS_CATEGORIES[c] ?? `Unbekannt (${c})`)
    .join(', ')
}

function build(fields: Record<string, string>, ski: string): ParseResult {
  const cat = fields.CAT ?? ''
  const fp = fields.FPH256 ?? fields.BFPH256 ?? fields.B2FPH256 ?? ''
  return {
    ok: true,
    data: {
      ski,
      ski_formatted: formatSki(ski),
      ship_id: fields.ID ?? '',
      brand: fields.BRAND ?? '',
      device_type: fields.TYPE ?? '',
      model: fields.MODEL ?? '',
      serial_number: fields.SERIAL ?? '',
      category: cat,
      category_label: categoryLabel(cat),
      fingerprint: fp.replace(/\s/g, '').toUpperCase(),
    },
  }
}

export function parseEebusQr(raw: string): ParseResult {
  const text = (raw ?? '').trim()
  if (!text) return { ok: false, error: 'Der QR-Code ist leer.' }

  // 1) Offizielles SHIP-Format
  if (/^SHIP;/i.test(text)) {
    if (!/ENDSHIP;?$/i.test(text)) {
      return { ok: false, error: 'Der QR-Code ist unvollständig (ENDSHIP fehlt). Bitte erneut scannen.' }
    }
    const fields: Record<string, string> = {}
    for (const part of text.split(';')) {
      const idx = part.indexOf(':')
      if (idx <= 0) continue // "SHIP", "ENDSHIP", leere Teile
      fields[part.slice(0, idx).trim().toUpperCase()] = part.slice(idx + 1).trim()
    }
    if (!fields.SKI) return { ok: false, error: 'Im QR-Code ist keine SKI enthalten.' }
    const ski = normalizeSki(fields.SKI)
    if (!ski) return { ok: false, error: 'Die SKI im QR-Code ist ungültig (erwartet: 40 Hex-Zeichen).' }
    return build(fields, ski)
  }

  // 2) Variante "SKI=...,ShipID=...,Fingerprint=..." (z. B. eebus-go / evcc)
  if (/SKI\s*=/i.test(text)) {
    const fields: Record<string, string> = {}
    for (const part of text.split(/[,;]/)) {
      const idx = part.indexOf('=')
      if (idx <= 0) continue
      const key = part.slice(0, idx).trim().toUpperCase()
      const val = part.slice(idx + 1).trim()
      if (key === 'SKI') fields.SKI = val
      else if (key === 'SHIPID' || key === 'ID') fields.ID = val
      else if (key === 'FINGERPRINT') fields.FPH256 = val
    }
    const ski = normalizeSki(fields.SKI ?? '')
    if (!ski) return { ok: false, error: 'Die SKI im QR-Code ist ungültig (erwartet: 40 Hex-Zeichen).' }
    return build(fields, ski)
  }

  // 3) Nur die SKI (manche Hersteller drucken nur diese als QR/Text)
  const ski = normalizeSki(text)
  if (ski) return build({}, ski)

  return { ok: false, error: 'Das ist kein EEBUS-QR-Code. Bitte den QR-Code auf dem Typenschild bzw. im Gerätemenü scannen.' }
}
