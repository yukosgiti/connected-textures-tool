import * as React from "react"

function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = React.useState<T>(initialValue)
  const [hasLoaded, setHasLoaded] = React.useState(false)

  React.useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(key)

      if (storedValue !== null) {
        setValue(JSON.parse(storedValue) as T)
      }
    } catch {
      setValue(initialValue)
    } finally {
      setHasLoaded(true)
    }
  }, [initialValue, key])

  React.useEffect(() => {
    if (!hasLoaded) {
      return
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore storage errors so the UI still works in restricted environments.
    }
  }, [hasLoaded, key, value])

  return [value, setValue, hasLoaded] as const
}

export { useLocalStorageState }