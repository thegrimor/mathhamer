import { useMemo } from 'react'

interface Props {
  mean: number
  sigma: number
  targetWounds: number
}

const SAMPLES   = 160
const VB_W      = 480
const VB_H      = 108
const PAD_T     = 8
const PAD_B     = 20
const PAD_S     = 18
const CHART_W   = VB_W - 2 * PAD_S
const CHART_H   = VB_H - PAD_T - PAD_B

const CRIMSON_DIM  = '#c41e1e'
const CRIMSON_BRT  = '#ff2222'
const GOLD         = '#c8962a'
const GOLD_BRT     = '#f0b840'
const PARCHMENT_DIM = '#a89880'
const RIM_BRT      = '#4a3a28'
const MONO         = "'Share Tech Mono', monospace"

function gaussPDF(x: number, mu: number, sig: number): number {
  return Math.exp(-0.5 * ((x - mu) / sig) ** 2) / (sig * Math.sqrt(2 * Math.PI))
}

function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x))
  const p = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))))
  const r = 1 - p * Math.exp(-x * x)
  return x < 0 ? -r : r
}

function normalCDF(x: number, mu: number, sig: number): number {
  return (1 + erf((x - mu) / (sig * Math.sqrt(2)))) / 2
}

function fmt(n: number): string {
  return n >= 10 ? n.toFixed(1) : n.toFixed(2)
}

export function GaussianChart({ mean, sigma, targetWounds }: Props) {
  const d = useMemo(() => {
    if (sigma < 0.05 || mean <= 0) return null

    const xMin = Math.max(0, mean - 4 * sigma)
    const xMax = mean + 4 * sigma
    const span = xMax - xMin

    const sx = (x: number) => PAD_S + ((x - xMin) / span) * CHART_W
    const yPeak = gaussPDF(mean, mean, sigma)
    const sy = (y: number) => PAD_T + CHART_H * (1 - y / (yPeak * 1.1))

    const xs    = Array.from({ length: SAMPLES + 1 }, (_, i) => xMin + span * i / SAMPLES)
    const polyPts = xs.map(x => `${sx(x).toFixed(1)},${sy(gaussPDF(x, mean, sigma)).toFixed(1)}`).join(' ')

    const baseY  = PAD_T + CHART_H
    const fillD  = `M ${PAD_S},${baseY} L ${polyPts} L ${PAD_S + CHART_W},${baseY} Z`

    const tClamp   = Math.max(xMin, Math.min(xMax, targetWounds))
    const targetX  = sx(tClamp)
    const meanX    = sx(mean)

    const killP    = 1 - normalCDF(targetWounds - 0.5, mean, sigma)
    const tooClose = Math.abs(meanX - targetX) < 30

    return { fillD, polyPts, baseY, meanX, targetX, killP, tooClose, xMin, xMax }
  }, [mean, sigma, targetWounds])

  if (!d) return null

  const { fillD, polyPts, baseY, meanX, targetX, killP, tooClose, xMax } = d
  const killZone = targetWounds < xMax
  const labelY   = baseY + 14
  const clipId   = `kz${Math.round(mean * 10)}-${Math.round(sigma * 10)}-${targetWounds}`

  return (
    <div className="border border-rim-bright bg-surface-2 px-3 pt-2 pb-3">
      <p className="text-xs font-display uppercase tracking-wide text-gold-bright mb-1">
        Campana de Gauss · distribución de daño
      </p>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" aria-label="Distribución gaussiana del daño esperado">
        <defs>
          <clipPath id={clipId}>
            <rect x={targetX} y={0} width={VB_W} height={VB_H} />
          </clipPath>
        </defs>

        {/* Relleno base (zona segura para el defensor) */}
        <path d={fillD} fill={CRIMSON_DIM} fillOpacity="0.18" />

        {/* Relleno zona de baja (daño ≥ heridas objetivo) */}
        {killZone && (
          <path d={fillD} fill={CRIMSON_BRT} fillOpacity="0.38" clipPath={`url(#${clipId})`} />
        )}

        {/* Eje X */}
        <line x1={PAD_S} y1={baseY} x2={PAD_S + CHART_W} y2={baseY} stroke={RIM_BRT} strokeWidth="1" />

        {/* Línea de la media */}
        <line
          x1={meanX} y1={PAD_T} x2={meanX} y2={baseY}
          stroke={GOLD_BRT} strokeWidth="1" strokeDasharray="4 3" strokeOpacity="0.65"
        />

        {/* Umbral de heridas del objetivo */}
        <line
          x1={targetX} y1={PAD_T} x2={targetX} y2={baseY}
          stroke={GOLD} strokeWidth="1.5" strokeOpacity="0.9"
        />

        {/* Curva */}
        <polyline points={polyPts} fill="none" stroke={CRIMSON_BRT} strokeWidth="1.5" strokeLinejoin="round" />

        {/* Etiqueta media */}
        <text
          x={meanX} y={labelY}
          textAnchor={tooClose ? 'end' : 'middle'}
          fill={GOLD_BRT} fontSize="9" fontFamily={MONO}
        >
          {fmt(mean)}
        </text>

        {/* Etiqueta heridas objetivo */}
        <text
          x={targetX + (tooClose ? 2 : 0)} y={labelY}
          textAnchor={tooClose ? 'start' : 'middle'}
          fill={GOLD} fontSize="9" fontFamily={MONO}
        >
          {targetWounds}H
        </text>

        {/* % de matar en zona crimson */}
        {killZone && killP > 0.01 && (
          <text
            x={Math.min(PAD_S + CHART_W - 4, (targetX + PAD_S + CHART_W) / 2)}
            y={PAD_T + 17}
            textAnchor="middle"
            fill={CRIMSON_BRT} fontSize="13" fontWeight="bold" fontFamily={MONO}
          >
            {(killP * 100).toFixed(0)}%
          </text>
        )}

        {/* % supervivencia en zona dim */}
        {killP < 0.99 && (1 - killP) > 0.01 && (
          <text
            x={Math.max(PAD_S + 4, (PAD_S + targetX) / 2)}
            y={PAD_T + 15}
            textAnchor="middle"
            fill={PARCHMENT_DIM} fontSize="10" fontFamily={MONO}
          >
            {((1 - killP) * 100).toFixed(0)}%
          </text>
        )}
      </svg>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-0.5 text-[9px] font-mono text-parchment-dim">
        <span className="flex items-center gap-1.5">
          <svg width="16" height="6" aria-hidden>
            <line x1="0" y1="3" x2="16" y2="3" stroke={GOLD_BRT} strokeWidth="1" strokeDasharray="3 2" />
          </svg>
          μ = {fmt(mean)} (media)
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="16" height="6" aria-hidden>
            <line x1="0" y1="3" x2="16" y2="3" stroke={GOLD} strokeWidth="1.5" />
          </svg>
          {targetWounds}H (umbral de baja)
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="12" height="10" aria-hidden>
            <rect x="0" y="0" width="12" height="10" fill={CRIMSON_BRT} fillOpacity="0.38" />
          </svg>
          zona de baja
        </span>
      </div>
    </div>
  )
}
