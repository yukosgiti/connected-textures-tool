import { afterEach, vi } from "vitest"

if (!globalThis.btoa) {
  globalThis.btoa = (value: string) => Buffer.from(value, "binary").toString("base64")
}

if (!globalThis.atob) {
  globalThis.atob = (value: string) => Buffer.from(value, "base64").toString("binary")
}

afterEach(() => {
  vi.restoreAllMocks()
})
