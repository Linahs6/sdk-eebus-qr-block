import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { decodeQr, decodeQrFromFile } from './decodeQr'
import { EebusDeviceData, parseEebusQr } from './parseEebusQr'
import { css } from './styles'

/**
 * Props, die der epilot-Journey-Wrapper an den Custom Block übergibt
 * (siehe @epilot/epilot-journey-sdk, ControlledCustomBlockProps + Starter custom-journey-block-react).
 */
type Props = {
  value?: EebusDeviceData | string | null
  setValue?: (v: EebusDeviceData | null) => void
  errors?: string
  required?: boolean
  theme?: unknown
  /** Im Journey Builder unter "Optionen" gepflegte Key/Value-Paare. */
  args?: Record<string, string> | string
  subscribe?: unknown
}

type Mode = 'idle' | 'camera' | 'manual' | 'result'

function parseMaybeJson<T>(v: unknown): T | undefined {
  if (v == null || v === '') return undefined
  if (typeof v === 'string') {
    try {
      return JSON.parse(v) as T
    } catch {
      return undefined
    }
  }
  return v as T
}

const EDITABLE: { key: keyof EebusDeviceData; label: string }[] = [
  { key: 'brand', label: 'Hersteller' },
  { key: 'model', label: 'Modell' },
  { key: 'device_type', label: 'Gerätetyp' },
  { key: 'serial_number', label: 'Seriennummer' },
]

export default function EebusQrBlock(props: Props) {
  const args = useMemo(() => parseMaybeJson<Record<string, string>>(props.args) ?? {}, [props.args])
  const initial = useMemo(() => {
    const v = parseMaybeJson<EebusDeviceData>(props.value)
    return v && typeof v === 'object' && v.ski ? v : null
    // nur beim ersten Rendern übernehmen (z. B. Zurück-Navigation in der Journey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [data, setData] = useState<EebusDeviceData | null>(initial)
  const [mode, setMode] = useState<Mode>(initial ? 'result' : 'idle')
  const [error, setError] = useState<string>('')
  const [manualText, setManualText] = useState('')
  const [busy, setBusy] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const title = args.title ?? 'EEBUS-QR-Code scannen'
  const hint =
    args.hint ??
    'Den EEBUS-QR-Code finden Sie auf dem Typenschild, in der Anleitung oder im Gerätemenü (z. B. Wallbox, Wärmepumpe, Energiemanagementsystem).'
  const allowManual = args.allow_manual !== 'false'
  const allowEdit = args.allow_edit !== 'false'

  const commit = useCallback(
    (next: EebusDeviceData | null) => {
      setData(next)
      props.setValue?.(next)
    },
    [props.setValue],
  )

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => stopCamera, [stopCamera])

  const handleRaw = useCallback(
    (raw: string, source: EebusDeviceData['source']) => {
      const r = parseEebusQr(raw)
      if (!r.ok) {
        setError(
          source === 'manual' && !/^SHIP;/i.test(raw.trim())
            ? 'Bitte eine gültige SKI eingeben: 40 Zeichen, nur 0–9 und A–F (Leerzeichen sind erlaubt).'
            : r.error,
        )
        return false
      }
      setError('')
      commit({ ...r.data, source, captured_at: new Date().toISOString() })
      setMode('result')
      return true
    },
    [commit],
  )

  const startCamera = async () => {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Ihr Browser unterstützt keinen Kamerazugriff. Bitte laden Sie ein Foto des QR-Codes hoch.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      setMode('camera')
    } catch (e) {
      const name = (e as DOMException)?.name
      setError(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'Kein Kamerazugriff erlaubt. Bitte Zugriff erlauben oder ein Foto des QR-Codes hochladen.'
          : 'Die Kamera konnte nicht gestartet werden. Bitte laden Sie ein Foto des QR-Codes hoch.',
      )
    }
  }

  // Scan-Schleife, solange die Kamera läuft
  useEffect(() => {
    if (mode !== 'camera') return
    const video = videoRef.current
    const stream = streamRef.current
    if (!video || !stream) return
    video.srcObject = stream
    video.play().catch(() => undefined)

    let cancelled = false
    let timer: number
    let lastError = ''
    const tick = async () => {
      if (cancelled) return
      if (video.readyState >= 2) {
        const raw = await decodeQr(video, video.videoWidth, video.videoHeight)
        if (cancelled) return
        if (raw) {
          const r = parseEebusQr(raw)
          if (r.ok) {
            stopCamera()
            handleRaw(raw, 'qr_scan')
            return
          }
          // Fremder QR-Code im Bild: Hinweis zeigen, weiter scannen
          if (r.error !== lastError) setError(r.error)
          lastError = r.error
        }
      }
      timer = window.setTimeout(tick, 200)
    }
    tick()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [mode, handleRaw, stopCamera])

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const raw = await decodeQrFromFile(file)
      if (!raw) setError('Auf dem Foto wurde kein QR-Code erkannt. Bitte näher heran und scharf fotografieren.')
      else handleRaw(raw, 'image_upload')
    } catch {
      setError('Das Bild konnte nicht gelesen werden.')
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    stopCamera()
    setError('')
    setManualText('')
    commit(null)
    setMode('idle')
  }

  const editField = (key: keyof EebusDeviceData, val: string) => {
    if (!data) return
    commit({ ...data, [key]: val })
  }

  const shownError = error || props.errors

  return (
    <div className="eebus">
      <style>{css}</style>

      <div className="eebus-header">
        <span className="eebus-title">
          {title}
          {props.required && <span className="eebus-req"> *</span>}
        </span>
        {mode !== 'result' && <p className="eebus-hint">{hint}</p>}
      </div>

      {mode === 'idle' && (
        <div className="eebus-actions">
          <button type="button" className="eebus-btn primary" onClick={startCamera}>
            QR-Code mit Kamera scannen
          </button>
          <button type="button" className="eebus-btn" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? 'Wird gelesen …' : 'Foto des QR-Codes hochladen'}
          </button>
          {allowManual && (
            <button type="button" className="eebus-link" onClick={() => setMode('manual')}>
              Kein QR-Code vorhanden? SKI manuell eingeben
            </button>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={onFile}
      />

      {mode === 'camera' && (
        <div className="eebus-camera">
          <div className="eebus-video-wrap">
            <video ref={videoRef} playsInline muted />
            <div className="eebus-frame" />
          </div>
          <p className="eebus-hint">QR-Code in den Rahmen halten – er wird automatisch erkannt.</p>
          <button
            type="button"
            className="eebus-btn"
            onClick={() => {
              stopCamera()
              setMode('idle')
            }}
          >
            Abbrechen
          </button>
        </div>
      )}

      {mode === 'manual' && (
        <div className="eebus-manual">
          <label className="eebus-field">
            <span>SKI (40 Zeichen) oder kompletter QR-Code-Inhalt</span>
            <textarea
              rows={2}
              value={manualText}
              placeholder="z. B. A805 56A2 43F5 7CA1 7B0D 577A 59B7 11B7 9EB4 856C"
              onChange={(e) => setManualText(e.target.value)}
            />
          </label>
          <div className="eebus-row">
            <button type="button" className="eebus-btn primary" onClick={() => handleRaw(manualText, 'manual')}>
              Übernehmen
            </button>
            <button type="button" className="eebus-btn" onClick={() => setMode('idle')}>
              Zurück
            </button>
          </div>
        </div>
      )}

      {mode === 'result' && data && (
        <div className="eebus-result">
          <div className="eebus-success">✓ EEBUS-Daten erfasst</div>

          <section className="eebus-card">
            <h4>Kommunikation (EEBUS)</h4>
            <dl>
              <dt>SKI</dt>
              <dd className="mono">{data.ski_formatted}</dd>
              {data.ship_id && (
                <>
                  <dt>SHIP-ID</dt>
                  <dd className="mono">{data.ship_id}</dd>
                </>
              )}
              {data.category_label && (
                <>
                  <dt>Kategorie</dt>
                  <dd>{data.category_label}</dd>
                </>
              )}
            </dl>
          </section>

          <section className="eebus-card">
            <h4>Gerät</h4>
            <div className="eebus-grid">
              {EDITABLE.map(({ key, label }) => (
                <label key={key} className="eebus-field">
                  <span>{label}</span>
                  <input
                    value={(data[key] as string) ?? ''}
                    readOnly={!allowEdit}
                    onChange={(e) => editField(key, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </section>

          <button type="button" className="eebus-link" onClick={reset}>
            Anderen QR-Code scannen
          </button>
        </div>
      )}

      {shownError && (
        <p className="eebus-error" role="alert">
          {shownError}
        </p>
      )}
    </div>
  )
}
