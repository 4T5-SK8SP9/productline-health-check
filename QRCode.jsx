import { useEffect, useRef } from 'react'

// Lightweight QR code generator using qrcode library via dynamic import
export default function QRCode({ value, size = 160 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!value || !canvasRef.current) return

    // Dynamically load qrcode library
    import('https://cdn.skypack.dev/qrcode').then(QRCodeLib => {
      QRCodeLib.default.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: { dark: '#1A1916', light: '#FFFFFF' }
      }).catch(console.error)
    }).catch(() => {
      // Fallback: use QR server API as image
      const img = document.createElement('img')
      img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`
      img.width = size
      img.height = size
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        img.onload = () => ctx.drawImage(img, 0, 0)
      }
    })
  }, [value, size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ borderRadius: 8, display: 'block' }}
    />
  )
}
