import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// React Testing Library mounts into a jsdom document; unmount after every test
// so component state cannot leak between tests.
afterEach(() => {
  cleanup()
})

// jsdom does not implement ResizeObserver, which the charting layer uses.
if (!('ResizeObserver' in globalThis)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(globalThis, 'ResizeObserver', {
    value: ResizeObserverStub,
    writable: true,
  })
}

// Export buttons create object URLs; jsdom has no implementation.
if (typeof URL.createObjectURL !== 'function') {
  Object.defineProperty(URL, 'createObjectURL', {
    value: () => 'blob:mock',
    writable: true,
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: () => undefined,
    writable: true,
  })
}

// In jsdom, triggering anchor.click() with a blob href logs "Not implemented: navigation"
HTMLAnchorElement.prototype.click = () => {}
