import r2wc from '@r2wc/react-to-web-component'
import EebusQrBlock from './EebusQrBlock'

// Prop-Vertrag wie im offiziellen Starter epilot-dev/custom-journey-block-react
const Base = r2wc(EebusQrBlock, {
  shadow: 'open',
  props: {
    value: 'json',
    errors: 'string',
    required: 'boolean',
    theme: 'json',
    args: 'json',
    setValue: 'function',
    subscribe: 'function',
  },
})

/**
 * r2wc löst 'function'-Props nur über einen globalen Funktionsnamen (Attribut) auf.
 * Damit der Block auch funktioniert, wenn die Journey die Callback-Funktion direkt als
 * Property setzt (el.setValue = fn), übernehmen wir Funktionen hier unverändert.
 */
const PROPS = Symbol.for('r2wc.props')
const RENDER = Symbol.for('r2wc.render')
for (const name of ['setValue', 'subscribe'] as const) {
  const original = Object.getOwnPropertyDescriptor(Base.prototype, name)
  Object.defineProperty(Base.prototype, name, {
    configurable: true,
    enumerable: true,
    get() {
      return (this as any)[PROPS][name]
    },
    set(fn: unknown) {
      if (typeof fn === 'function') {
        ;(this as any)[PROPS][name] = fn
        ;(this as any)[RENDER]()
      } else {
        original?.set?.call(this, fn)
      }
    },
  })
}

const TAG = 'epilot-eebus-qr-scanner'
if (!customElements.get(TAG)) customElements.define(TAG, Base)
