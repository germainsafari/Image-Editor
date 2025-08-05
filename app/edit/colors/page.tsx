'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Palette, ArrowRight } from 'lucide-react'
import EditorLayout from '@/components/EditorLayout'
import { useImageStore } from '@/lib/store'
import { getProxiedImageUrl } from '@/lib/utils'

// CSS filter definitions for immediate visual feedback
const FILTERS = {
  none: 'none',
  warm: 'sepia(0.2) contrast(1.1) brightness(1.05)',
  cool: 'hue-rotate(180deg) contrast(1.1) brightness(0.95)',
  vintage: 'sepia(0.4) contrast(0.9) saturate(0.8)',
  bw: 'grayscale(1) contrast(1.2)',
  contrast: 'contrast(1.5) saturate(1.2)',
  soft: 'brightness(1.1) saturate(0.9)',
  vibrant: 'saturate(1.4) contrast(1.1)',
}

const colorFilters = [
  { name: 'None', value: 'none', description: 'No filter applied' },
  { name: 'Warm', value: 'warm', description: 'Adds warm, golden tones' },
  { name: 'Cool', value: 'cool', description: 'Adds cool, blue tones' },
  { name: 'Vintage', value: 'vintage', description: 'Sepia and vintage look' },
  { name: 'Black & White', value: 'bw', description: 'Classic monochrome' },
  { name: 'High Contrast', value: 'contrast', description: 'Enhanced contrast' },
  { name: 'Soft', value: 'soft', description: 'Softer, muted tones' },
  { name: 'Vibrant', value: 'vibrant', description: 'Enhanced saturation' },
]

export default function ColorsEditPage() {
  const router = useRouter()
  const { getCurrentVersion, addVersion, setProcessing, setError, isHydrated } = useImageStore()
  const currentVersion = getCurrentVersion()
  const [selectedFilter, setSelectedFilter] = useState<string>('none')
  const [isProcessing, setIsProcessing] = useState(false)
  const [appliedImageUrl, setAppliedImageUrl] = useState<string | null>(null)

  // Apply filter immediately when selected
  const handleFilterSelect = (filterValue: string) => {
    setSelectedFilter(filterValue)
  }

  const handleApplyFilter = async () => {
    if (!currentVersion || selectedFilter === 'none') return

    try {
      setIsProcessing(true)
      setProcessing(true)
      setError(null)

      // Apply the filter using canvas to create a permanent version
      const filteredImageUrl = await applyFilterToImage(currentVersion.imageUrl, selectedFilter)
      setAppliedImageUrl(filteredImageUrl)
      
    } catch (error) {
      console.error('Error applying filter:', error)
      setError('Failed to apply color filter. Please try again.')
    } finally {
      setIsProcessing(false)
      setProcessing(false)
    }
  }

  const handleNext = async () => {
    if (!currentVersion) return

    try {
      setIsProcessing(true)
      setProcessing(true)
      setError(null)

      // If a filter was applied, save it as a new version
      if (appliedImageUrl) {
        await addVersion({
          type: 'color',
          imageUrl: appliedImageUrl,
          parent: currentVersion.id,
          metadata: {
            colorSettings: {
              filter: selectedFilter,
            }
          }
        })
      }
      
      router.push('/edit/crop')
    } catch (error) {
      console.error('Error saving version:', error)
      setError('Failed to save color filter. Please try again.')
    } finally {
      setIsProcessing(false)
      setProcessing(false)
    }
  }

  // Function to apply filter using canvas for permanent storage
  const applyFilterToImage = async (imageUrl: string, filterValue: string): Promise<string> => {
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
        canvas.width = img.width
        canvas.height = img.height
        
        // Apply the filter using CSS-like transformations
        ctx.filter = FILTERS[filterValue as keyof typeof FILTERS] || 'none'
        ctx.drawImage(img, 0, 0)
        
        // Convert to blob URL
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            resolve(url)
          } else {
            reject(new Error('Failed to create blob'))
          }
        }, 'image/jpeg', 0.9)
      }
      
      img.onerror = (error) => {
        console.error('Image load error:', error)
        reject(new Error('Failed to load image for filtering. This may be due to CORS restrictions.'))
      }
      
      // Use proxied URL if it's an external image
      const finalImageUrl = getProxiedImageUrl(imageUrl)
      img.src = finalImageUrl
    })
  }

  // Show loading state while store is hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-abb-red mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to home if no current version
  if (!currentVersion) {
    router.push('/')
    return null
  }

  return (
    <EditorLayout currentStep="colors">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Edit Colors
          </h2>
          <p className="text-gray-600">
            Apply color filters and adjustments to your image, or skip to the next step.
          </p>
        </div>

        {/* Image Display with Immediate Filter Preview */}
        <div className="mb-6">
          <div className="relative rounded-lg overflow-hidden bg-gray-100">
            <img
              src={appliedImageUrl || getProxiedImageUrl(currentVersion.imageUrl)}
              alt="Current image"
              className="w-full h-auto max-h-96 object-contain mx-auto"
              style={!appliedImageUrl ? { filter: FILTERS[selectedFilter as keyof typeof FILTERS] || 'none' } : {}}
            />
            {selectedFilter !== 'none' && !appliedImageUrl && (
              <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-sm">
                Filter Preview
              </div>
            )}
            {appliedImageUrl && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-sm">
                Filter Applied
              </div>
            )}
          </div>
        </div>

        {/* Color Filter Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Color Filters (optional)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {colorFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => handleFilterSelect(filter.value)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200 text-left
                  ${selectedFilter === filter.value 
                    ? 'border-abb-red bg-red-50 text-abb-red' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }
                `}
              >
                <div className="font-medium text-sm">{filter.name}</div>
                <div className="text-xs text-gray-500 mt-1">{filter.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <button
              onClick={handleApplyFilter}
              disabled={selectedFilter === 'none' || isProcessing}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-abb-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Applying...
                </>
              ) : (
                <>
                  <Palette size={20} className="mr-2" />
                  Apply
                </>
              )}
            </button>
          </div>

          <button
            onClick={handleNext}
            disabled={isProcessing}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                Next Step
                <ArrowRight size={20} className="ml-2" />
              </>
            )}
          </button>
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Color Filter Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Warm:</strong> Great for portraits and cozy scenes</li>
            <li>• <strong>Cool:</strong> Perfect for professional and modern looks</li>
            <li>• <strong>Vintage:</strong> Adds a classic, timeless feel</li>
            <li>• <strong>High Contrast:</strong> Makes details pop in technical images</li>
            <li>• <strong>Vibrant:</strong> Enhances colors for marketing materials</li>
          </ul>
        </div>
      </div>
    </EditorLayout>
  )
} 