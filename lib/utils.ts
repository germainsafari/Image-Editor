import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateImageUrl(file: File): string {
  return URL.createObjectURL(file)
}

// Convert external URLs to proxy URLs to avoid CORS issues
export function getProxiedImageUrl(imageUrl: string): string {
  // If it's already a blob URL or data URL, return as is
  if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
    return imageUrl
  }
  
  // If it's a local URL, return as is
  if (imageUrl.startsWith('/') || imageUrl.startsWith('http://localhost')) {
    return imageUrl
  }
  
  // For external URLs, use our proxy
  const encodedUrl = encodeURIComponent(imageUrl)
  return `/api/proxy-image?url=${encodedUrl}`
}

export async function checkAIGenerated(file: File): Promise<{ isAI: boolean; confidence: number; details: any }> {
  try {
    // Convert file to base64 for API analysis
    const imageBase64 = await fileToBase64(file)
    
    // Call our AI detection API
    const response = await fetch('/api/ai-detection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64
      })
    })

    if (!response.ok) {
      throw new Error(`AI detection API error: ${response.status}`)
    }

    const result = await response.json()
    return {
      isAI: result.isAI,
      confidence: result.confidence,
      details: result.details
    }
  } catch (error) {
    console.error('AI detection error:', error)
    
    // Fallback to local analysis if API fails
    return await performLocalAIAnalysis(file)
  }
}

// Helper function to convert file to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      // Remove the data URL prefix to get just the base64
      resolve(base64String.split(',')[1])
    }
    reader.readAsDataURL(file)
  })
}

// Local AI analysis as fallback
async function performLocalAIAnalysis(file: File): Promise<{ isAI: boolean; confidence: number; details: any }> {
  const metadata = await getImageMetadata(file)
  const analysis = {
    fileSize: file.size,
    dimensions: metadata,
    characteristics: await analyzeImageCharacteristics(file)
  }
  
  // Multi-factor analysis
  let aiScore = 0
  let totalFactors = 0
  
  // Factor 1: File size analysis
  if (file.size < 500000) aiScore += 0.3 // Very small files
  else if (file.size < 2000000) aiScore += 0.1 // Small files
  totalFactors += 1
  
  // Factor 2: Aspect ratio analysis
  const aspectRatio = metadata.width / metadata.height
  if (aspectRatio === 1) aiScore += 0.2 // Square images
  else if (aspectRatio === 16/9 || aspectRatio === 4/3) aiScore += 0.05 // Common ratios
  totalFactors += 1
  
  // Factor 3: Resolution analysis
  const megapixels = (metadata.width * metadata.height) / 1000000
  if (megapixels < 1) aiScore += 0.3 // Low resolution
  else if (megapixels < 4) aiScore += 0.1 // Medium resolution
  totalFactors += 1
  
  // Factor 4: Image characteristics
  if (analysis.characteristics.hasUniformNoise) aiScore += 0.2
  if (analysis.characteristics.hasPerfectSymmetry) aiScore += 0.15
  if (analysis.characteristics.hasUnusualArtifacts) aiScore += 0.25
  totalFactors += 3
  
  const confidence = Math.min(aiScore / totalFactors, 0.95)
  const isAI = confidence > 0.6
  
  return {
    isAI,
    confidence,
    details: {
      analysis,
      factors: {
        fileSize: file.size,
        aspectRatio,
        megapixels,
        characteristics: analysis.characteristics
      }
    }
  }
}

// Analyze image characteristics using canvas
async function analyzeImageCharacteristics(file: File): Promise<{
  hasUniformNoise: boolean
  hasPerfectSymmetry: boolean
  hasUnusualArtifacts: boolean
}> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        resolve({
          hasUniformNoise: false,
          hasPerfectSymmetry: false,
          hasUnusualArtifacts: false
        })
        return
      }
      
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      // Analyze noise patterns
      const noiseAnalysis = analyzeNoisePatterns(data, canvas.width, canvas.height)
      
      // Analyze symmetry
      const symmetryAnalysis = analyzeSymmetry(data, canvas.width, canvas.height)
      
      // Analyze artifacts
      const artifactAnalysis = analyzeArtifacts(data, canvas.width, canvas.height)
      
      resolve({
        hasUniformNoise: noiseAnalysis.isUniform,
        hasPerfectSymmetry: symmetryAnalysis.isPerfect,
        hasUnusualArtifacts: artifactAnalysis.hasUnusual
      })
    }
    img.src = URL.createObjectURL(file)
  })
}

// Analyze noise patterns in the image
function analyzeNoisePatterns(data: Uint8ClampedArray, width: number, height: number) {
  const samples = []
  const step = Math.max(1, Math.floor(width * height / 1000)) // Sample 1000 pixels
  
  for (let i = 0; i < data.length; i += step * 4) {
    if (i + 2 < data.length) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      samples.push((r + g + b) / 3)
    }
  }
  
  // Calculate noise variance
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length
  const variance = samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / samples.length
  
  return {
    isUniform: variance < 100 // Low variance suggests uniform noise
  }
}

// Analyze symmetry in the image
function analyzeSymmetry(data: Uint8ClampedArray, width: number, height: number) {
  let symmetryScore = 0
  const centerX = Math.floor(width / 2)
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < centerX; x++) {
      const leftIndex = (y * width + x) * 4
      const rightIndex = (y * width + (width - 1 - x)) * 4
      
      if (leftIndex < data.length && rightIndex < data.length) {
        const leftDiff = Math.abs(data[leftIndex] - data[rightIndex]) +
                        Math.abs(data[leftIndex + 1] - data[rightIndex + 1]) +
                        Math.abs(data[leftIndex + 2] - data[rightIndex + 2])
        symmetryScore += leftDiff
      }
    }
  }
  
  const avgSymmetryDiff = symmetryScore / (width * height)
  return {
    isPerfect: avgSymmetryDiff < 10 // Very low difference suggests perfect symmetry
  }
}

// Analyze artifacts that are common in AI-generated images
function analyzeArtifacts(data: Uint8ClampedArray, width: number, height: number) {
  let artifactCount = 0
  
  // Look for unusual pixel patterns
  for (let i = 0; i < data.length - 4; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    
    // Check for unusual color combinations
    if (Math.abs(r - g) > 200 && Math.abs(r - b) > 200) {
      artifactCount++
    }
    
    // Check for compression artifacts
    if (i + 4 < data.length) {
      const nextR = data[i + 4]
      const nextG = data[i + 5]
      const nextB = data[i + 6]
      
      if (Math.abs(r - nextR) > 100 && Math.abs(g - nextG) < 10 && Math.abs(b - nextB) < 10) {
        artifactCount++
      }
    }
  }
  
  const artifactRatio = artifactCount / (data.length / 4)
  return {
    hasUnusual: artifactRatio > 0.01 // More than 1% unusual artifacts
  }
}

export async function getImageMetadata(file: File): Promise<{ width: number; height: number; format: string }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        format: file.type
      })
    }
    img.src = URL.createObjectURL(file)
  })
}

export async function callFluxKontextAPI(imageUrl: string, prompt: string): Promise<string> {
  try {
    // Convert image URL to base64 if it's a blob URL
    let imageBase64: string
    
    if (imageUrl.startsWith('blob:')) {
      // Fetch the blob and convert to base64
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      imageBase64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = reader.result as string
          // Remove the data URL prefix to get just the base64
          resolve(base64String.split(',')[1])
        }
        reader.readAsDataURL(blob)
      })
    } else {
      // If it's already a base64 or external URL, we need to handle it differently
      // For now, we'll assume it's a base64 string
      imageBase64 = imageUrl.split(',')[1] || imageUrl
    }

    // Call our internal API route
    const response = await fetch('/api/flux-kontext', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
        prompt: prompt
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `API error: ${response.status}`)
    }

    const result = await response.json()
    
    // Handle the new response format that returns multiple images
    if (result.editedImageUrls && result.editedImageUrls.length > 0) {
      // Use the first edited image
      const editedImageUrl = result.editedImageUrls[0]
      
      // If the image is already a URL, return it directly
      if (editedImageUrl.startsWith('http')) {
        return editedImageUrl
      }
      
      // If it's base64, convert to blob URL
      if (editedImageUrl.startsWith('data:') || editedImageUrl.length > 100) {
        // Convert base64 back to blob URL
        const byteCharacters = atob(editedImageUrl.split(',')[1] || editedImageUrl)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'image/jpeg' })
        return URL.createObjectURL(blob)
      }
      
      throw new Error('Invalid image format returned from API')
    } else {
      throw new Error('No images returned from Flux Kontext API')
    }
  } catch (error) {
    console.error('Flux Kontext API error:', error)
    throw error
  }
}

export function applyColorFilter(imageUrl: string, filter: string): string {
  // Simulate color filter application
  // In real implementation, this would apply actual color transformations
  return imageUrl
}

/**
 * Generate image description using OpenAI GPT-4 Vision
 */
export async function generateImageDescription(imageUrl: string): Promise<{
  title: string
  description: string
  tags: string[]
}> {
  try {
    // Convert blob URL to base64 if needed
    let processedImageUrl = imageUrl
    
    if (imageUrl.startsWith('blob:')) {
      try {
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            resolve(reader.result as string)
          }
          reader.readAsDataURL(blob)
        })
        processedImageUrl = base64
      } catch (error) {
        console.error('Error converting blob to base64:', error)
        throw new Error('Failed to process image data')
      }
    }

    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: processedImageUrl,
        guidelines: {
          descriptionStyle: "Descriptive but short, clear and searchable. Focus on key visual elements, business context, and industrial applications. Use professional ABB terminology. Maximum 400 characters.",
          tagStyle: "Include industry-specific terms, product categories, applications, and technical specifications relevant to ABB's business areas (robotics, power grids, industrial automation, etc.)"
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `API error: ${response.status}`)
    }

    const result = await response.json()
    
    // Ensure description follows guidelines
    let description = result.description || 'No description available.'
    if (description.length > 400) {
      description = description.substring(0, 397) + '...'
    }
    
    // Ensure title follows guidelines
    let title = result.title || 'Untitled Image'
    if (title.length > 60) {
      title = title.substring(0, 57) + '...'
    }
    
    // Enhance tags with ABB-specific categories if not present
    let tags = result.tags || ['image', 'analysis']
    const abbSpecificTags = [
      'industrial', 'automation', 'robotics', 'power', 'grid', 'technology', 
      'manufacturing', 'energy', 'infrastructure', 'equipment', 'solution'
    ]
    
    // Add ABB-specific tags if they're not already present
    abbSpecificTags.forEach(tag => {
      if (!tags.includes(tag) && tags.length < 10) {
        tags.push(tag)
      }
    })
    
    return {
      title,
      description,
      tags: tags.slice(0, 10) // Limit to 10 tags
    }
  } catch (error) {
    console.error('OpenAI image analysis error:', error)
    // Fallback response with ABB focus
    return {
      title: 'ABB Industrial Image',
      description: 'Professional industrial image suitable for ABB applications. Features industrial equipment, technology, or infrastructure relevant to automation and power systems.',
      tags: ['industrial', 'automation', 'technology', 'ABB', 'professional']
    }
  }
}

export function downloadImage(imageUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = imageUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
} 

/**
 * Crop an image using canvas
 */
export function cropImage(
  imageUrl: string,
  crop: { x: number; y: number; width: number; height: number; unit?: string },
  imageDimensions: { width: number; height: number }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      let pixelCrop: { x: number; y: number; width: number; height: number }
      
      // Handle both percentage and pixel coordinates
      if (crop.unit === '%') {
        // Convert percentage to pixels
        pixelCrop = {
          x: Math.round((crop.x / 100) * img.naturalWidth),
          y: Math.round((crop.y / 100) * img.naturalHeight),
          width: Math.round((crop.width / 100) * img.naturalWidth),
          height: Math.round((crop.height / 100) * img.naturalHeight)
        }
      } else {
        // Already in pixels, but ensure they're within bounds
        pixelCrop = {
          x: Math.round(crop.x),
          y: Math.round(crop.y),
          width: Math.round(crop.width),
          height: Math.round(crop.height)
        }
      }

      // Validate crop dimensions
      if (pixelCrop.width <= 0 || pixelCrop.height <= 0) {
        reject(new Error('Invalid crop dimensions'))
        return
      }

      // Ensure crop area is within image boundaries
      pixelCrop.x = Math.max(0, Math.min(pixelCrop.x, img.naturalWidth - pixelCrop.width))
      pixelCrop.y = Math.max(0, Math.min(pixelCrop.y, img.naturalHeight - pixelCrop.height))
      pixelCrop.width = Math.min(pixelCrop.width, img.naturalWidth - pixelCrop.x)
      pixelCrop.height = Math.min(pixelCrop.height, img.naturalHeight - pixelCrop.y)

      console.log('Crop operation:', {
        originalCrop: crop,
        pixelCrop,
        imageNaturalSize: { width: img.naturalWidth, height: img.naturalHeight },
        canvasSize: { width: pixelCrop.width, height: pixelCrop.height }
      })

      // Set canvas size to crop dimensions
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height

      // Clear canvas with white background (prevents black areas)
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw the cropped image
      ctx.drawImage(
        img,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      )

      // Convert to blob URL
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedImageUrl = URL.createObjectURL(blob)
          console.log('Crop successful, created blob URL:', croppedImageUrl)
          resolve(croppedImageUrl)
        } else {
          reject(new Error('Failed to create cropped image'))
        }
      }, 'image/jpeg', 0.95)
    }

    img.onerror = (error) => {
      console.error('Image load error for cropping:', error)
      reject(new Error('Failed to load image for cropping. This may be due to CORS restrictions.'))
    }

    // Prefer proxy for any external URL to avoid CORS-tainted canvas
    let finalImageUrl = imageUrl
    
    if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
      // Keep blob and data URLs as is
      finalImageUrl = imageUrl
    } else {
      // Use proxied URL for all external images (including Azure blob URLs)
      finalImageUrl = getProxiedImageUrl(imageUrl)
    }
    
    img.src = finalImageUrl
  })
} 