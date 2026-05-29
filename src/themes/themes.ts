export interface Theme {
  id: ThemeId
  name: string
  faction: string
  colors: {
    crimson: string
    crimsonBright: string
    crimsonDim: string
    gold: string
    goldBright: string
    neon: string
    surface: string
    surface2: string
    surface3: string
    surface4: string
    parchment: string
    parchmentDim: string
    rim: string
    rimBright: string
    scanlineRgb: string
    vignetteRgb: string
    gridHRgb: string
    gridVRgb: string
  }
}

export type ThemeId = 'imperial' | 'chaos' | 'necron' | 'tau' | 'ork'

export const THEMES: Theme[] = [
  {
    id: 'imperial',
    name: 'Grimdark Imperial',
    faction: 'Space Marines',
    colors: {
      crimson:      '#c41e1e',
      crimsonBright:'#ff2222',
      crimsonDim:   '#7a0f0f',
      gold:         '#c8962a',
      goldBright:   '#f0b840',
      neon:         '#2aff6a',
      surface:      '#080808',
      surface2:     '#0f0f0f',
      surface3:     '#161616',
      surface4:     '#1e1e1e',
      parchment:    '#e8dcc8',
      parchmentDim: '#a89880',
      rim:          '#2a2218',
      rimBright:    '#4a3a28',
      scanlineRgb:  '196, 30, 30',
      vignetteRgb:  '196, 30, 30',
      gridHRgb:     '196, 30, 30',
      gridVRgb:     '200, 150, 42',
    },
  },
  {
    id: 'chaos',
    name: 'Fuerza del Caos',
    faction: 'Chaos Space Marines',
    colors: {
      crimson:      '#9b1fa8',
      crimsonBright:'#d930f0',
      crimsonDim:   '#5a0f63',
      gold:         '#00d4c8',
      goldBright:   '#20f5e8',
      neon:         '#ff36f7',
      surface:      '#06030d',
      surface2:     '#0d0616',
      surface3:     '#130a1f',
      surface4:     '#1c1228',
      parchment:    '#e2d0f0',
      parchmentDim: '#9880b0',
      rim:          '#1e0a28',
      rimBright:    '#3a1a50',
      scanlineRgb:  '155, 31, 168',
      vignetteRgb:  '155, 31, 168',
      gridHRgb:     '155, 31, 168',
      gridVRgb:     '0, 212, 200',
    },
  },
  {
    id: 'necron',
    name: 'Dinastía Necron',
    faction: 'Necrons',
    colors: {
      crimson:      '#0d7a6b',
      crimsonBright:'#00e5c8',
      crimsonDim:   '#074a3e',
      gold:         '#39e800',
      goldBright:   '#80ff20',
      neon:         '#d4ff40',
      surface:      '#020b09',
      surface2:     '#050f0d',
      surface3:     '#091512',
      surface4:     '#0e1e1b',
      parchment:    '#d8ebe6',
      parchmentDim: '#8ab0a8',
      rim:          '#0d2820',
      rimBright:    '#1a4034',
      scanlineRgb:  '13, 122, 107',
      vignetteRgb:  '0, 229, 200',
      gridHRgb:     '13, 122, 107',
      gridVRgb:     '57, 232, 0',
    },
  },
  {
    id: 'tau',
    name: "Imperio T'au",
    faction: "T'au Empire",
    colors: {
      crimson:      '#1565c0',
      crimsonBright:'#4da6ff',
      crimsonDim:   '#0a3d7a',
      gold:         '#e87020',
      goldBright:   '#ff9040',
      neon:         '#00e5ff',
      surface:      '#030810',
      surface2:     '#060d1c',
      surface3:     '#0a1428',
      surface4:     '#101c34',
      parchment:    '#d0e4f8',
      parchmentDim: '#7a9fc0',
      rim:          '#0c1e3a',
      rimBright:    '#1a3460',
      scanlineRgb:  '21, 101, 192',
      vignetteRgb:  '21, 101, 192',
      gridHRgb:     '21, 101, 192',
      gridVRgb:     '232, 112, 32',
    },
  },
  {
    id: 'ork',
    name: 'WAAAGH! Orko',
    faction: 'Orks',
    colors: {
      crimson:      '#2a6e1a',
      crimsonBright:'#50d820',
      crimsonDim:   '#154010',
      gold:         '#c85000',
      goldBright:   '#f07820',
      neon:         '#d0ff00',
      surface:      '#040800',
      surface2:     '#080f02',
      surface3:     '#0d1504',
      surface4:     '#141e08',
      parchment:    '#d8e4c0',
      parchmentDim: '#88a060',
      rim:          '#1a2808',
      rimBright:    '#2e4010',
      scanlineRgb:  '42, 110, 26',
      vignetteRgb:  '42, 110, 26',
      gridHRgb:     '42, 110, 26',
      gridVRgb:     '200, 80, 0',
    },
  },
]

export const DEFAULT_THEME_ID: ThemeId = 'imperial'
