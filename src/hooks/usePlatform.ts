import { useEffect, useState } from 'react'

export function usePlatform() {
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    // Check if we're on Mac/iOS
    const isMacOS = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)
    setIsMac(isMacOS)
  }, [])

  return {
    isMac,
    modKey: isMac ? '⌘' : 'Ctrl',
    modKeyName: isMac ? 'Cmd' : 'Ctrl',
  }
}
