import QRCode from 'qrcode'

export interface DownloadQrCodeOptions {
  type: 'table' | 'guest'
  qrCodeId: string
  eventName: string
  tableNumber?: number
  guestName?: string
  department?: string
  guestCount?: number
  baseUrl: string
}

export interface GenerateQrCodeOptions {
  type: 'table' | 'guest'
  qrCodeId: string
  eventName: string
  tableNumber?: number
  guestName?: string
  department?: string
  guestCount?: number
  baseUrl: string
}

/**
 * Generates a QR code as an Image element
 */
async function generateQrImage(url: string, size: number): Promise<HTMLImageElement> {
  const dataUrl = await QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    color: {
      dark: '#111827',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'H'
  })

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * Draws the card content to a canvas
 */
async function drawCardToCanvas(
  canvas: HTMLCanvasElement,
  options: DownloadQrCodeOptions | GenerateQrCodeOptions
): Promise<void> {
  const {
    type,
    qrCodeId,
    eventName,
    tableNumber,
    guestName,
    department,
    guestCount,
    baseUrl
  } = options

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  // Set canvas size
  canvas.width = 400
  canvas.height = 520

  // Background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 400, 520)

  // Header background
  ctx.fillStyle = '#f9fafb'
  ctx.fillRect(0, 0, 400, 100)

  // Event name at top
  ctx.fillStyle = '#6b7280'
  ctx.font = '14px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  const displayEventName = eventName.length > 35 ? eventName.slice(0, 32) + '...' : eventName
  ctx.fillText(displayEventName, 200, 30)

  // Generate QR code URL
  const qrUrl = `${baseUrl}/scan/${qrCodeId}`

  // QR code size and position
  const qrSize = 280
  const qrX = (400 - qrSize) / 2 // Center horizontally
  const qrY = 130

  if (type === 'table' && tableNumber !== undefined) {
    // Table number
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 42px system-ui, -apple-system, sans-serif'
    ctx.fillText(`Table ${tableNumber}`, 200, 70)

    // Guest count
    if (guestCount !== undefined) {
      ctx.fillStyle = '#6b7280'
      ctx.font = '14px system-ui, -apple-system, sans-serif'
      ctx.fillText(`${guestCount} guest${guestCount !== 1 ? 's' : ''}`, 200, 95)
    }

    // Generate and draw QR code
    const qrImg = await generateQrImage(qrUrl, qrSize)
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

    // Bottom text
    ctx.fillStyle = '#6b7280'
    ctx.font = '16px system-ui, -apple-system, sans-serif'
    ctx.fillText('Scan to view table assignment', 200, 450)

    // Decorative line
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(50, 480)
    ctx.lineTo(350, 480)
    ctx.stroke()

    // Footer
    ctx.fillStyle = '#9ca3af'
    ctx.font = '11px system-ui, -apple-system, sans-serif'
    ctx.fillText('Table Assignment Card', 200, 505)

  } else if (type === 'guest' && guestName) {
    // Guest name
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif'

    // Handle long names
    const displayGuestName = guestName.length > 25 ? guestName.slice(0, 22) + '...' : guestName
    ctx.fillText(displayGuestName, 200, department ? 60 : 70)

    // Department
    if (department) {
      ctx.fillStyle = '#6b7280'
      ctx.font = '13px system-ui, -apple-system, sans-serif'
      const displayDept = department.length > 30 ? department.slice(0, 27) + '...' : department
      ctx.fillText(displayDept, 200, 85)
    }

    // Generate and draw QR code
    const qrImg = await generateQrImage(qrUrl, qrSize)
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

    // Bottom text
    ctx.fillStyle = '#6b7280'
    ctx.font = '16px system-ui, -apple-system, sans-serif'
    ctx.fillText('Scan to find your table', 200, 450)

    // Decorative line
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(50, 480)
    ctx.lineTo(350, 480)
    ctx.stroke()

    // Footer
    ctx.fillStyle = '#9ca3af'
    ctx.font = '11px system-ui, -apple-system, sans-serif'
    ctx.fillText('Personal Seating Card', 200, 505)
  }
}

/**
 * Downloads a branded QR code as a PNG file
 * Creates a 400x520px image with event branding and QR code
 */
export async function downloadQrCode(options: DownloadQrCodeOptions): Promise<void> {
  const canvas = document.createElement('canvas')
  await drawCardToCanvas(canvas, options)

  const { type, tableNumber, guestName } = options

  // Convert to blob and download
  canvas.toBlob((blob) => {
    if (!blob) {
      throw new Error('Failed to create image blob')
    }

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    if (type === 'table' && tableNumber !== undefined) {
      link.download = `table-${tableNumber}-qr.png`
    } else if (type === 'guest' && guestName) {
      const sanitizedName = guestName.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      link.download = `${sanitizedName}-qr.png`
    }

    link.href = url
    link.click()

    // Cleanup
    URL.revokeObjectURL(url)
  }, 'image/png')
}

/**
 * Generates a branded QR code as a Blob (for batch operations like ZIP)
 * Creates a 400x520px image with event branding and QR code
 */
export async function generateQrCodeBlob(options: GenerateQrCodeOptions): Promise<Blob> {
  const canvas = document.createElement('canvas')
  await drawCardToCanvas(canvas, options)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create image blob'))
        return
      }
      resolve(blob)
    }, 'image/png')
  })
}
