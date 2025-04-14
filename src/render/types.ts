export interface IRenderState {
  rerender: () => Promise<void> | void,
  cleanUp: () => void,
}
