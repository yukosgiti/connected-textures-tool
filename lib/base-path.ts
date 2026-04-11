const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

export function withBasePath(path: string) {
  if (!path) {
    return BASE_PATH || "/"
  }

  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith("data:")) {
    return path
  }

  if (!path.startsWith("/")) {
    return `${BASE_PATH}/${path}`
  }

  return `${BASE_PATH}${path}`
}