import { createMockState } from './cytoscapeMock'

/**
 * Shared mock state.
 *
 * `vi.mock` factories are hoisted above imports, so the factory imports this
 * module to obtain the same state object the tests inspect. Resetting the fields
 * (rather than replacing the object) keeps that shared reference valid.
 */
export const mockState = createMockState()
