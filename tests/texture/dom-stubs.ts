type MockImageEntry = {
  width: number
  height: number
  pixels: Uint8ClampedArray
}

export function installTextureDomStubs(
  images: Record<string, MockImageEntry>,
  objectUrl = "blob:mock"
) {
  const originalDocument = globalThis.document
  const originalImage = globalThis.Image
  const originalImageData = globalThis.ImageData
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL

  class MockImageData {
    constructor(
      public data: Uint8ClampedArray,
      public width: number,
      public height: number
    ) {}
  }

  class MockCanvasContext {
    private drawnPixels = new Uint8ClampedArray()
    private currentImageData: MockImageData | null = null

    drawImage(image: { __pixels?: Uint8ClampedArray }) {
      this.drawnPixels = new Uint8ClampedArray(image.__pixels ?? [])
    }

    getImageData() {
      return { data: new Uint8ClampedArray(this.drawnPixels) }
    }

    putImageData(imageData: MockImageData) {
      this.currentImageData = imageData
    }

    toDataUrl() {
      return `data:mock,${Array.from(this.currentImageData?.data ?? []).join(",")}`
    }
  }

  class MockCanvas {
    width = 0
    height = 0
    private readonly context = new MockCanvasContext()

    getContext() {
      return this.context
    }

    toDataURL() {
      return this.context.toDataUrl()
    }
  }

  class MockImage {
    width = 0
    height = 0
    onload: null | (() => void) = null
    onerror: null | (() => void) = null
    __pixels = new Uint8ClampedArray()

    set src(value: string) {
      const image = images[value]

      queueMicrotask(() => {
        if (!image) {
          this.onerror?.()
          return
        }

        this.width = image.width
        this.height = image.height
        this.__pixels = new Uint8ClampedArray(image.pixels)
        this.onload?.()
      })
    }
  }

  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement(tagName: string) {
        if (tagName !== "canvas") {
          throw new Error(`Unsupported element: ${tagName}`)
        }

        return new MockCanvas()
      },
    },
  })

  Object.defineProperty(globalThis, "Image", {
    configurable: true,
    value: MockImage,
  })

  Object.defineProperty(globalThis, "ImageData", {
    configurable: true,
    value: MockImageData,
  })

  URL.createObjectURL = () => objectUrl
  URL.revokeObjectURL = () => {}

  return () => {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: originalDocument,
    })
    Object.defineProperty(globalThis, "Image", {
      configurable: true,
      value: originalImage,
    })
    Object.defineProperty(globalThis, "ImageData", {
      configurable: true,
      value: originalImageData,
    })
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
  }
}
