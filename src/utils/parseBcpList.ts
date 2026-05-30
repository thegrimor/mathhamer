export interface BcpList {
  factionName: string
  detachmentName: string
  unitNames: string[]
}

const SECTION_HEADER_RE = /^[A-Z][A-Z\s]+$/

export function parseBcpList(text: string): BcpList | null {
  const lines = text.split('\n').map(l => l.trimEnd())
  let i = 0

  while (i < lines.length && lines[i].trim() === '') i++
  if (i >= lines.length) return null
  if (/\(\d+ points\)/i.test(lines[i])) i++

  const headerLines: string[] = []
  while (i < lines.length) {
    const line = lines[i].trim()
    if (SECTION_HEADER_RE.test(line) && line.length > 2) break
    if (line !== '') headerLines.push(line)
    i++
  }

  const metaLines = headerLines.filter(l => !/\(\d+ points\)/i.test(l))
  if (metaLines.length < 2) return null
  const factionName = metaLines[0]
  const detachmentName = metaLines[1]

  const unitNames: string[] = []
  const seen = new Set<string>()
  while (i < lines.length) {
    const line = lines[i]
    if (!line.startsWith(' ') && !line.startsWith('\t') && /\(\d+ points\)/i.test(line)) {
      const name = line.replace(/\s*\(\d+ points\).*/i, '').trim()
      if (name && !SECTION_HEADER_RE.test(name) && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase())
        unitNames.push(name)
      }
    }
    i++
  }

  return { factionName, detachmentName, unitNames }
}
