import { useState, useEffect, useCallback } from 'react'
import { THEMES, DEFAULT_THEME_ID } from '@/themes/themes'
import type { Theme, ThemeId } from '@/themes/themes'

const LS_KEY = 'mathhammer-theme'

function readPersistedThemeId(): ThemeId {
  try {
    const stored = localStorage.getItem(LS_KEY)
    if (stored && THEMES.some(t => t.id === stored)) return stored as ThemeId
  } catch {
    // localStorage not available (private mode, SSR)
  }
  return DEFAULT_THEME_ID
}

export function useTheme(): [Theme, (id: ThemeId) => void, Theme[]] {
  const [themeId, setThemeId] = useState<ThemeId>(readPersistedThemeId)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId)
  }, [themeId])

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id)
    try {
      localStorage.setItem(LS_KEY, id)
    } catch {
      // ignore
    }
  }, [])

  const currentTheme = THEMES.find(t => t.id === themeId) ?? THEMES[0]
  return [currentTheme, setTheme, THEMES]
}
