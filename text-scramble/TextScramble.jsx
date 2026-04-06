import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

const GLYPHS = ['?', '§', '/', '$', '!', '>', '<', '+', '%', '#', '&', 'x']
const SCRAMBLE_INTERVAL_MS = 72
const SCRAMBLE_REVEAL_MS = 620
const SCRAMBLE_HIDE_MS = 420
const GLYPH_COLOR = '#757575'
const CLEAR_COLOR = '#000000'

const DEFAULT_ASSETS = [
  {
    id: 'featured-jersey',
    hint: 'jersey grail',
    allocation: '??% of ETF',
    image: '/image-globe/Image Assets/Cavs.jpg',
  },
  {
    id: 'countach',
    hint: 'speed icon',
    allocation: '??% of ETF',
    image: '/image-globe/Image Assets/Lamborghini Countach Professional Photo Shoot 1.jpg',
  },
  {
    id: 'air-jordan',
    hint: 'iconic pair',
    allocation: '??% of ETF',
    image: '/image-globe/Image Assets/Air Jordan.jpg',
  },
  {
    id: 'ring',
    hint: 'ring relic',
    allocation: '??% of ETF',
    image: '/image-globe/Image Assets/Championship ring.jpg',
  },
  {
    id: 'guitar',
    hint: 'stage sixstring',
    allocation: '??% of ETF',
    image: '/image-globe/Image Assets/Guitar.jpg',
  },
  {
    id: 'camera',
    hint: 'camera classic',
    allocation: '??% of ETF',
    image: '/image-globe/Image Assets/Camera.jpg',
  },
  {
    id: 'headline',
    hint: 'press scoop',
    allocation: '??% of ETF',
    image: '/image-globe/Image Assets/NYtimes.jpg',
  },
  {
    id: 'poster',
    hint: 'cult poster',
    allocation: '??% of ETF',
    image: '/image-globe/Image Assets/Batman.jpg',
  },
]

function makeGlyphLabel(target) {
  return target
    .split('')
    .map((char, index) => {
      if (char === ' ' || char === '\n') return char
      return GLYPHS[(index * 3 + target.length) % GLYPHS.length]
    })
    .join('')
}

function scrambleFrame(target, progress) {
  return target
    .split('')
    .map((char, index) => {
      if (char === ' ' || char === '\n') return char
      const revealThreshold = Math.max(0, progress * target.length - index * 0.55)
      if (revealThreshold > 0.9 || progress >= 1) return char
      const poolIndex = (Math.floor(progress * 19) + index * 5 + target.length) % GLYPHS.length
      return GLYPHS[poolIndex]
    })
    .join('')
}

function scrambleBackFrame(target, hiddenTarget, progress) {
  return target
    .split('')
    .map((char, index) => {
      if (char === ' ' || char === '\n') return char
      const hideThreshold = Math.max(0, progress * target.length - index * 0.65)
      if (hideThreshold > 0.9 || progress >= 1) return hiddenTarget[index]
      const poolIndex = (Math.floor(progress * 23) + index * 7 + target.length) % GLYPHS.length
      return GLYPHS[poolIndex]
    })
    .join('')
}

function scrambleBetween(source, target, progress) {
  return target
    .split('')
    .map((targetChar, index) => {
      if (targetChar === ' ' || targetChar === '\n') return targetChar

      const sourceChar = source[index] ?? GLYPHS[(index + target.length) % GLYPHS.length]
      if (progress <= 0.08) {
        return sourceChar === ' ' || sourceChar === '\n'
          ? GLYPHS[(index + target.length) % GLYPHS.length]
          : sourceChar
      }

      const revealThreshold = Math.max(0, progress * (target.length + 2) - index * 0.58)
      if (revealThreshold > 1 || progress >= 1) return targetChar
      if (progress < 0.22 && sourceChar !== ' ' && sourceChar !== '\n') return sourceChar

      const poolIndex = (Math.floor(progress * 29) + index * 7 + target.length) % GLYPHS.length
      return GLYPHS[poolIndex]
    })
    .join('')
}

function mixColor(fromHex, toHex, progress) {
  const clamped = Math.max(0, Math.min(progress, 1))
  const from = fromHex.slice(1)
  const to = toHex.slice(1)
  const channels = [0, 2, 4].map((index) => {
    const start = Number.parseInt(from.slice(index, index + 2), 16)
    const end = Number.parseInt(to.slice(index, index + 2), 16)
    return Math.round(start + (end - start) * clamped)
  })
  return `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`
}

function wrapLabelToWidth(text, measureNode) {
  if (!measureNode) return text

  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length <= 1) return text

  const computed = window.getComputedStyle(measureNode)
        const lineHeight = Number.parseFloat(computed.lineHeight) || 15
  const threshold = lineHeight + 1
  const lines = []
  let currentLine = ''

  measureNode.textContent = ''

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word
    measureNode.textContent = candidate

    if (currentLine && measureNode.scrollHeight > threshold) {
      lines.push(currentLine)
      currentLine = word
      measureNode.textContent = currentLine
    } else {
      currentLine = candidate
    }
  }

  if (currentLine) lines.push(currentLine)
  return lines.join('\n')
}

function EyeSlashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ts-eye-icon">
      <path d="M3 3l18 18" />
      <path d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58" />
      <path d="M9.88 5.09A9.77 9.77 0 0112 4.8c4.2 0 7.8 2.6 9.2 6.2a10.75 10.75 0 01-2.33 3.47" />
      <path d="M6.1 6.1A10.9 10.9 0 002.8 11c1.4 3.6 5 6.2 9.2 6.2 1.48 0 2.9-.32 4.18-.9" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ts-lock-icon">
      <path d="M8.75 10V8.25a3.25 3.25 0 016.5 0V10h.5A2.25 2.25 0 0118 12.25v6.5A2.25 2.25 0 0115.75 21h-7.5A2.25 2.25 0 016 18.75v-6.5A2.25 2.25 0 018.25 10h.5zm1.5 0h3.5V8.4a1.75 1.75 0 00-3.5 0V10z" />
    </svg>
  )
}

function HoldButton({ pressed, onPressStart, onPressEnd }) {
  return (
    <button
      type="button"
      className={`ts-hold-button ${pressed ? 'is-pressed' : ''}`}
      aria-label="Press and hold to show asset hint"
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={onPressStart}
      onPointerUp={onPressEnd}
      onPointerCancel={onPressEnd}
      onPointerLeave={onPressEnd}
      onLostPointerCapture={onPressEnd}
    >
      <span className="ts-hold-chip">
        <EyeSlashIcon />
      </span>
      <span className="ts-hold-label">show hint</span>
    </button>
  )
}

function AssetImage({ asset }) {
  const [hasError, setHasError] = useState(false)
  const fallbackStyle = {
    background:
      'radial-gradient(circle at 35% 20%, rgba(255,255,255,0.34), transparent 24%), linear-gradient(180deg, #b8b8b8 0%, #9d9d9d 45%, #696969 100%)',
  }

  return (
    <div className="ts-asset-image" style={hasError ? fallbackStyle : undefined}>
      {!hasError && <img src={asset.image} alt="" onError={() => setHasError(true)} />}
      <div className="ts-asset-lock">
        <LockIcon />
      </div>
    </div>
  )
}

function AssetRow({ asset }) {
  const rawLabel = useMemo(() => String(asset.hint || '').toUpperCase(), [asset.hint])
  const measureRef = useRef(null)
  const titleRef = useRef(null)
  const [clearLabel, setClearLabel] = useState(rawLabel)
  const hiddenLabel = useMemo(() => makeGlyphLabel(clearLabel), [clearLabel])
  const [phase, setPhase] = useState('hidden')
  const [displayLabel, setDisplayLabel] = useState(hiddenLabel)
  const [titleColor, setTitleColor] = useState(GLYPH_COLOR)
  const displayRef = useRef(hiddenLabel)

  useLayoutEffect(() => {
    if (!measureRef.current || !titleRef.current) return undefined

    const updateWrap = () => {
      const nextLabel = wrapLabelToWidth(rawLabel, measureRef.current)
      setClearLabel((current) => (current === nextLabel ? current : nextLabel))
    }

    updateWrap()
    const observer = new ResizeObserver(updateWrap)
    observer.observe(titleRef.current)

    return () => observer.disconnect()
  }, [rawLabel])

  useEffect(() => {
    displayRef.current = displayLabel
  }, [displayLabel])

  useEffect(() => {
    if (phase === 'hidden') {
      setDisplayLabel(hiddenLabel)
      setTitleColor(GLYPH_COLOR)
      return undefined
    }

    if (phase === 'visible') {
      setDisplayLabel(clearLabel)
      setTitleColor(CLEAR_COLOR)
      return undefined
    }

    let active = true
    let timeoutId = null
    const startedAt = performance.now()
    const sourceText = displayRef.current
    const targetText = phase === 'revealing' ? clearLabel : hiddenLabel

    const update = () => {
      if (!active) return
      const elapsed = performance.now() - startedAt
      const duration = phase === 'revealing' ? SCRAMBLE_REVEAL_MS : SCRAMBLE_HIDE_MS
      const rawProgress = Math.min(elapsed / duration, 1)
      setDisplayLabel(scrambleBetween(sourceText, targetText, rawProgress))
      setTitleColor(
        phase === 'revealing'
          ? mixColor(GLYPH_COLOR, CLEAR_COLOR, rawProgress)
          : mixColor(CLEAR_COLOR, GLYPH_COLOR, rawProgress),
      )

      if (rawProgress < 1) {
        timeoutId = window.setTimeout(update, SCRAMBLE_INTERVAL_MS)
      } else if (phase === 'revealing') {
        setDisplayLabel(targetText)
        setPhase('visible')
        setTitleColor(CLEAR_COLOR)
      } else {
        setDisplayLabel(targetText)
        setPhase('hidden')
        setTitleColor(GLYPH_COLOR)
      }
    }

    update()

    return () => {
      active = false
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [clearLabel, hiddenLabel, phase])

  const handlePressStart = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    setPhase((current) => (current === 'revealing' || current === 'visible' ? current : 'revealing'))
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handlePressEnd = () => {
    setPhase((current) => (current === 'hidden' || current === 'hiding' ? current : 'hiding'))
  }

  return (
    <article className="ts-asset-row">
      <div className="ts-asset-copy">
        <div className="ts-asset-copy-wrap">
          <div ref={titleRef} className="ts-asset-text">
            <span ref={measureRef} className="ts-asset-title ts-asset-title-measure" aria-hidden="true" />
            <p className="ts-asset-title" style={{ color: titleColor }}>{displayLabel}</p>
            <p className="ts-asset-share">{asset.allocation}</p>
          </div>

          <HoldButton
            pressed={phase === 'revealing'}
            onPressStart={handlePressStart}
            onPressEnd={handlePressEnd}
          />
        </div>
      </div>

      <AssetImage asset={asset} />
    </article>
  )
}

export default function TextScramble({
  assets = DEFAULT_ASSETS,
  title = '40 Assets in ETF',
  subtitle = 'Locked until launch.',
  badgeLabel = 'Comin soon',
}) {
  return (
    <>
      <style>{`
        .ts-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 32px 12px;
          background: #1a1a1a;
          color: #171717;
          font-family: "Aktiv Grotesk", "Inter", "Segoe UI", sans-serif;
          overflow-x: hidden;
        }

        .ts-phone {
          width: min(calc(100vw - 24px), 375px);
          max-width: 100%;
          height: 812px;
          border-radius: 30px;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid rgba(23, 23, 23, 0.06);
          box-shadow: 0 30px 70px rgba(34, 27, 16, 0.18);
        }

        .ts-screen {
          height: 100%;
          padding: 32px 16px;
          background: #ffffff;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .ts-screen::-webkit-scrollbar {
          display: none;
        }

        .ts-header {
          width: 343px;
          max-width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .ts-eyebrow {
          margin: 0;
          font-family: "Aktiv Grotesk Cd", "Arial Narrow", sans-serif;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .ts-subcopy {
          margin: 2px 0 0;
          font-size: 12px;
          line-height: 1;
          color: #757575;
        }

        .ts-badge {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 28px;
          padding: 0 12px;
          border: 1px solid #06d1fe;
          background: #ffffff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .ts-badge-dot {
          width: 6px;
          height: 6px;
          background: #06d1fe;
        }

        .ts-list {
          width: 343px;
          max-width: 100%;
          margin-top: 28px;
        }

        .ts-asset-row {
          position: relative;
          display: flex;
          align-items: stretch;
          min-height: 101px;
          background: #ffffff;
        }

        .ts-asset-row::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 0.5px;
          background: #d9d9d9;
        }

        .ts-asset-copy {
          flex: 1 1 auto;
          min-width: 0;
          padding: 0 16px 0 8px;
          display: flex;
          align-items: center;
        }

        .ts-asset-copy-wrap {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .ts-asset-text {
          position: relative;
          min-width: 0;
          max-width: 168px;
          min-height: 18px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .ts-asset-title {
          margin: 0;
          font-family: "Neue Montreal", "Neue Haas Grotesk Display Pro", "Inter", sans-serif;
          font-size: 14px;
          font-weight: 500;
          line-height: 15px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          white-space: nowrap;
          word-break: normal;
          max-width: 100%;
          overflow: hidden;
          transition: color 72ms linear;
        }

        .ts-asset-title-measure {
          display: block;
          position: absolute;
          visibility: hidden;
          pointer-events: none;
          inset: 0 auto auto 0;
          width: 100%;
        }

        .ts-asset-share {
          margin: 4px 0 0;
          font-family: "Neue Montreal", "Neue Haas Grotesk Display Pro", "Inter", sans-serif;
          font-size: 11px;
          font-weight: 500;
          line-height: 1;
          letter-spacing: -0.02em;
          color: #757575;
        }

        .ts-hold-button {
          flex: 0 0 auto;
          border: 0;
          padding: 0;
          background: transparent;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          color: #757575;
          cursor: pointer;
          user-select: none;
          touch-action: none;
        }

        .ts-hold-button.is-pressed .ts-hold-chip,
        .ts-hold-button:active .ts-hold-chip {
          transform: scale(0.97);
        }

        .ts-hold-chip {
          min-width: 34px;
          height: 22px;
          padding: 0 8px;
          display: grid;
          place-items: center;
          border-radius: 5px;
          background: #06d1fe;
          transition: transform 140ms ease;
        }

        .ts-hold-label {
          font-family: "Neue Montreal", "Neue Haas Grotesk Display Pro", "Inter", sans-serif;
          font-size: 11px;
          font-weight: 500;
          line-height: 1;
          letter-spacing: -0.02em;
        }

        .ts-eye-icon,
        .ts-lock-icon {
          width: 18px;
          height: 18px;
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .ts-eye-icon {
          stroke: #ffffff;
          stroke-width: 1.8;
        }

        .ts-lock-icon {
          width: 24px;
          height: 24px;
          fill: rgba(255, 255, 255, 0.94);
          stroke: none;
        }

        .ts-asset-image {
          position: relative;
          flex: 0 0 78px;
          width: 78px;
          min-height: 101px;
          overflow: hidden;
          background: linear-gradient(180deg, #c9c9c9 0%, #8f8f8f 100%);
        }

        .ts-asset-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scale(1.42);
          filter: blur(12px) saturate(0.82);
        }

        .ts-asset-image::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(174deg, rgba(102, 102, 102, 0) 55%, rgba(0, 0, 0, 0.72) 100%);
        }

        .ts-asset-image::after {
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(128, 128, 128, 0.2);
        }

        .ts-asset-lock {
          position: absolute;
          inset: 0;
          z-index: 1;
          display: grid;
          place-items: center;
        }

        @media (max-width: 420px) {
          .ts-page {
            padding: 24px 0;
          }

          .ts-phone {
            width: min(calc(100vw - 24px), 375px);
            border-radius: 30px;
          }
        }
      `}</style>

      <main className="ts-page">
        <section className="ts-phone">
          <div className="ts-screen">
            <header className="ts-header">
              <div>
                <p className="ts-eyebrow">{title}</p>
                <p className="ts-subcopy">{subtitle}</p>
              </div>

              <div className="ts-badge">
                <span className="ts-badge-dot" />
                <span>{badgeLabel}</span>
              </div>
            </header>

            <div className="ts-list">
              {assets.map((asset) => (
                <AssetRow key={asset.id} asset={asset} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export { DEFAULT_ASSETS }
