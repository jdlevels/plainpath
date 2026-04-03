import { useEffect, useRef } from "react"

export default function GridPulseCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let width = 0
    let height = 0
    let waveRadius = 0
    const waveSpeed = 80
    const gridSpacing = 28
    const baseRadius = 1.5
    const waveWidth = 40
    let lastTime = performance.now()

    const resizeCanvas = () => {
      const parent = canvas.parentElement
      width = parent ? parent.offsetWidth : window.innerWidth
      height = parent ? parent.offsetHeight : window.innerHeight
      canvas.width = width
      canvas.height = height
    }

    window.addEventListener("resize", resizeCanvas)
    resizeCanvas()

    const draw = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1)
      lastTime = time

      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = "#0f172a"
      ctx.fillRect(0, 0, width, height)

      const centerX = width / 2
      const centerY = height / 2
      const maxDist = Math.sqrt(centerX * centerX + centerY * centerY) * 1.2

      waveRadius += waveSpeed * dt
      if (waveRadius > maxDist) waveRadius = 0

      for (let x = 0; x < width; x += gridSpacing) {
        for (let y = 0; y < height; y += gridSpacing) {
          const dx = x - centerX
          const dy = y - centerY
          const dist = Math.sqrt(dx * dx + dy * dy)
          const distFromWave = Math.abs(dist - waveRadius)

          let radius = baseRadius
          let color = "rgba(148, 163, 184, 0.15)"

          if (distFromWave < waveWidth / 2) {
            const intensity = Math.cos((distFromWave / (waveWidth / 2)) * (Math.PI / 2))
            radius = baseRadius + intensity * 1.5
            const r = Math.round(148 + (99 - 148) * intensity)
            const g = Math.round(163 + (102 - 163) * intensity)
            const b = Math.round(184 + (241 - 184) * intensity)
            const a = 0.15 + (0.8 - 0.15) * intensity
            color = `rgba(${r}, ${g}, ${b}, ${a})`
          }

          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fillStyle = color
          ctx.fill()
        }
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    animationFrameId = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 block w-full h-full"
    />
  )
}
