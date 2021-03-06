import DefaultDOMElement from '../dom/DefaultDOMElement'
import platform from '../util/platform'
import isFunction from '../util/isFunction'

/*
  TODO: to be 100% safe we would need to introduce a hidden contenteditable
  where we put the selection in case of non-surface situations
  so that we are still able to receive events such as 'copy' -- actually only Edge is not dispatching
  to window.document.
*/

const EVENTS = new Set(['keydown', 'keyup', 'keypress', 'mousedown', 'mouseup', 'copy'])

export default class GlobalEventHandler {
  constructor () {
    // a stack of listeners
    this._listeners = new Map()

    this.initialize()
  }

  initialize () {
    EVENTS.forEach(name => this._listeners.set(name, []))
    if (platform.inBrowser) {
      const documentEl = DefaultDOMElement.wrapNativeElement(window.document)
      EVENTS.forEach(name => {
        documentEl.on(name, this._dispatch.bind(this, name), this)
      })
    }
  }

  dispose () {
    if (platform.inBrowser) {
      const documentEl = DefaultDOMElement.wrapNativeElement(window.document)
      documentEl.off(this)
    }
    this._listeners.length = 0
  }

  addEventListener (eventName, handleFunction, owner) {
    if (!EVENTS.has(eventName)) throw new Error(`Unsupported event global event ${eventName}`)
    if (!isFunction(handleFunction)) throw new Error('Illegal argument')
    if (!owner) throw new Error('"owner" is mandatory')
    const listeners = this._listeners.get(eventName)
    listeners.push({
      handleFunction,
      owner
    })
  }

  removeEventListener (owner) {
    for (const listeners of this._listeners.values()) {
      for (let idx = listeners.length - 1; idx >= 0; idx--) {
        if (listeners[idx].owner === owner) listeners.splice(idx, 1)
      }
    }
  }

  _dispatch (eventName, event) {
    const listeners = this._listeners.get(eventName)
    // ATTENTION: iterating reverse is a preliminary solution
    // to the 'modal' problem. I.e. a modal also needs to register
    // a global event handler. In that time, the other event handlers
    // should not react.
    // Reverse iteration let's the modal handle events first, and stop bubbling
    for (let idx = listeners.length - 1; idx >= 0; idx--) {
      const { handleFunction, owner } = listeners[idx]
      // TODO: not sure if event.cancelBubble works cross browser
      // Alternatively, we can use return true logic to stop bubbling
      const res = handleFunction.call(owner, event)
      if (event.cancelBubble || res === true) break
    }
  }
}
