import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseEebusQr } from './parseEebusQr.ts'

const FULL =
  'SHIP;SKI:A805 56A2 43F5 7CA1 7B0D 577A 59B7 11B7 9EB4 856C;ID:i:983327_u:C8277H008F-3;BRAND:EXAMPLEBRAND;TYPE:EMS;MODEL:EEB01devA814;SERIAL:C8277H008F-3;CAT:2;FPH256:C74B7855D3479415F62CC01E5F6D9A93EBC676057D85417ADA16FD1384338943;SPSEC:7A37DCF81BDB50F8E92CFA4160CCB3DE;ENDSHIP;'

test('parses the full SHIP pairing QR code', () => {
  const r = parseEebusQr(FULL)
  assert.ok(r.ok)
  assert.equal(r.data.ski, 'A80556A243F57CA17B0D577A59B711B79EB4856C')
  assert.equal(r.data.ski_formatted, 'A805 56A2 43F5 7CA1 7B0D 577A 59B7 11B7 9EB4 856C')
  assert.equal(r.data.ship_id, 'i:983327_u:C8277H008F-3')
  assert.equal(r.data.brand, 'EXAMPLEBRAND')
  assert.equal(r.data.device_type, 'EMS')
  assert.equal(r.data.model, 'EEB01devA814')
  assert.equal(r.data.serial_number, 'C8277H008F-3')
  assert.equal(r.data.category, '2')
  assert.match(r.data.category_label, /Energiemanagement/)
  assert.equal(r.data.fingerprint.length, 64)
  assert.ok(!JSON.stringify(r.data).includes('7A37DCF8'), 'SPSEC must not leak')
})

test('parses legacy SHIP 1.0 code without pairing fields, any order, lowercase', () => {
  const r = parseEebusQr('SHIP;BRAND:Vaillant;ski:a80556a243f57ca17b0d577a59b711b79eb4856c;CAT:4;ENDSHIP;')
  assert.ok(r.ok)
  assert.equal(r.data.ski, 'A80556A243F57CA17B0D577A59B711B79EB4856C')
  assert.equal(r.data.ship_id, '')
  assert.match(r.data.category_label, /Wärmepumpe/)
})

test('parses SKI=… variant and plain SKI', () => {
  const a = parseEebusQr('SKI=A80556A243F57CA17B0D577A59B711B79EB4856C,ShipID=abc,Fingerprint=ff')
  assert.ok(a.ok)
  assert.equal(a.data.ship_id, 'abc')
  const b = parseEebusQr('a805-56a2-43f5-7ca1-7b0d-577a-59b7-11b7-9eb4-856c')
  assert.ok(b.ok)
})

test('rejects invalid input', () => {
  assert.equal(parseEebusQr('').ok, false)
  assert.equal(parseEebusQr('https://example.com').ok, false)
  assert.equal(parseEebusQr('SHIP;SKI:1234;ENDSHIP;').ok, false)
  assert.equal(parseEebusQr('SHIP;SKI:A80556A243F57CA17B0D577A59B711B79EB4856C;').ok, false)
  assert.equal(parseEebusQr('SHIP;ID:x;ENDSHIP;').ok, false)
})

test('multiple categories', () => {
  const r = parseEebusQr('SHIP;SKI:A80556A243F57CA17B0D577A59B711B79EB4856C;CAT:3,5;ENDSHIP;')
  assert.ok(r.ok)
  assert.match(r.data.category_label, /E-Mobilität.*Wechselrichter/)
})
