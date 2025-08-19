'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Crop, Check, ArrowRight, RotateCcw } from 'lucide-react'
import ReactCrop, { Crop as CropType, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
// ReactCrop CSS is imported via app/globals.css custom styles for v11
import EditorLayout from '@/components/EditorLayout'
import { useImageStore } from '@/lib/store'
import { cropImage } from '@/lib/utils'

const aspectRatioPresets = [
  { name: 'Original', ratio: null, icon: '🖼️' },
  { name: 'Free', ratio: undefined, icon: '✂️' },
  { name: '1:1', ratio: 1, icon: '⬜' },
  { name: '3:4', ratio: 3/4, icon: '📱' },
  { name: '3:2', ratio: 3/2, icon: '📷' },
  { name: '5:4', ratio: 5/4, icon: '🖼️' },
  { name: '16:9', ratio: 16/9, icon: '📺' },
  { name: '4:3', ratio: 4/3, icon: '🖥️' },
]

export default function CropEditPage() {
  const router = useRouter()
  const { getCurrentVersion, addVersion, setProcessing, setError, isHydrated, error, isProcessing } = useImageStore()
  const currentVersion = getCurrentVersion()
  const [crop, setCrop] = useState<CropType>()
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>('Free')
  const [isCropping, setIsCropping] = useState(false)
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null)
  const [initialCrop, setInitialCrop] = useState<CropType>()
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const [hasCropChanged, setHasCropChanged] = useState(false)
  const [imageLoadError, setImageLoadError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const imgRef = useRef<HTMLImageElement>(null)

  // Initialize crop on image load
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const imgEl = e.currentTarget
    // Use natural dimensions for accurate cropping calculations
    setImageDimensions({ width: imgEl.naturalWidth, height: imgEl.naturalHeight })
    setImageLoading(false)
    setImageLoadError(false)
    
    // Create initial crop (60% of image, centered) - no aspect ratio constraint for Free mode
    const initialCrop: CropType = {
      unit: '%',
      width: 60,
      height: 60,
      x: 20,
      y: 20,
    }
    
    setCrop(initialCrop)
    setInitialCrop(initialCrop)
    setHasCropChanged(false)
  }, [])

  // Retry loading image
  const retryImageLoad = useCallback(() => {
    if (!currentVersion) return
    
    setImageLoading(true)
    setImageLoadError(false)
    setError(null)
    
    // Force a re-render of the image
    setTimeout(() => {
      if (imgRef.current) {
        const img = imgRef.current
        const currentSrc = img.src
        img.src = ''
        img.src = currentSrc
      }
    }, 100)
  }, [currentVersion, setError])

  // Handle image load error
  const onImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageLoadError(true)
    setImageLoading(false)
    setError('Failed to load image. Please check the image URL or try refreshing the page.')
  }, [setError])

  // Image loading timeout
  useEffect(() => {
    if (imageLoading && currentVersion) {
      const timeout = setTimeout(() => {
        if (imageLoading) {
          retryImageLoad()
        }
      }, 3000)
      
      return () => clearTimeout(timeout)
    }
  }, [imageLoading, currentVersion, retryImageLoad])

  // Force show image after timeout
  useEffect(() => {
    if (imageLoading && currentVersion) {
      const forceShowTimeout = setTimeout(() => {
        if (imageLoading) {
          setImageLoading(false)
          setImageLoadError(false)
          if (!crop && currentVersion) {
            const basicCrop: CropType = {
              unit: '%',
              width: 60,
              height: 60,
              x: 20,
              y: 20,
            }
            setCrop(basicCrop)
            setInitialCrop(basicCrop)
          }
        }
      }, 5000)
      
      return () => clearTimeout(forceShowTimeout)
    }
  }, [imageLoading, currentVersion, crop])

  // Set loading state when currentVersion changes
  useEffect(() => {
    if (currentVersion) {
      setImageLoading(true)
      setImageLoadError(false)
      setError(null)
      
      if (imgRef.current && imgRef.current.complete) {
        setImageLoading(false)
      }
    }
  }, [currentVersion, setError])

  // Safety check to ensure crop area is always visible in Free mode
  useEffect(() => {
    if (selectedAspectRatio === 'Free' && (!crop || crop.width <= 0 || crop.height <= 0)) {
      const safetyCrop: CropType = {
        unit: '%',
        width: 60,
        height: 60,
        x: 20,
        y: 20,
      }
      setCrop(safetyCrop)
    }
  }, [selectedAspectRatio, crop])

  // Handle aspect ratio change
  const handleAspectRatioChange = useCallback((preset: typeof aspectRatioPresets[0]) => {
    setSelectedAspectRatio(preset.name)
    setHasCropChanged(true)
    
    if (!imageDimensions) return

    if (preset.name === 'Original') {
      // Fit to image but respect viewport using centerCrop for stability
      const full = centerCrop(
        {
          unit: '%',
          width: 100,
          height: 100,
          x: 0,
          y: 0,
        },
        imageDimensions.width,
        imageDimensions.height
      ) as CropType
      setCrop(full)
      return
    }

    if (preset.name === 'Free') {
      // For Free mode, ensure we always have a valid crop area
      // Use current crop if it exists, otherwise create a new one
      let freeCrop: CropType
      
      if (crop && crop.width > 0 && crop.height > 0) {
        // Keep the current crop area but ensure it's not constrained
        freeCrop = {
          unit: '%',
          width: crop.width,
          height: crop.height,
          x: crop.x || 20,
          y: crop.y || 20,
        }
      } else {
        // Create a new crop area if none exists
        freeCrop = {
          unit: '%',
          width: 60,
          height: 60,
          x: 20,
          y: 20,
        }
      }
      
      setCrop(freeCrop)
      return
    }

    if (preset.ratio) {
      // Use makeAspectCrop + centerCrop to produce a stable centered crop
      const aspectC = makeAspectCrop(
        { unit: '%', width: 80, height: 80 },
        preset.ratio,
        imageDimensions.width,
        imageDimensions.height
      )
      const centered = centerCrop(
        aspectC,
        imageDimensions.width,
        imageDimensions.height
      ) as CropType
      setCrop(centered)
    }
  }, [imageDimensions, crop])

  // Handle crop change
  const handleCropChange = useCallback((nextCrop: CropType) => {
    // ReactCrop v11 default onChange passes percent crop when 'crop' is percent-based
    setCrop(nextCrop)
    if (nextCrop && nextCrop.width && nextCrop.height) setHasCropChanged(true)
  }, [])

  // Handle crop completion
  const handleCropComplete = useCallback((_: PixelCrop, percentCrop: CropType) => {
    if (percentCrop && percentCrop.width && percentCrop.height) setHasCropChanged(true)
  }, [])

  // Apply crop
  const handleApplyCrop = async () => {
    if (!crop || !currentVersion || !imageDimensions) {
      setError('Please wait for the image to load completely before cropping.')
      return
    }

    try {
      setIsCropping(true)
      setProcessing(true)
      setError(null)

      if (crop.width <= 0 || crop.height <= 0) {
        setError('Invalid crop area. Please adjust the crop selection.')
        return
      }

      const cropData = {
        x: crop.x,
        y: crop.y,
        width: crop.width,
        height: crop.height,
        unit: crop.unit || 'px'
      }

      const croppedImageUrl = await cropImage(
        currentVersion.imageUrl,
        cropData,
        imageDimensions
      )
      
      setCroppedImageUrl(croppedImageUrl)
    } catch (error) {
      console.error('Crop error:', error)
      if (error instanceof Error && error.message.includes('timeout')) {
        setError('Crop operation timed out. Please try again with a smaller crop area.')
      } else {
        setError('Failed to crop image. Please try again.')
      }
    } finally {
      setIsCropping(false)
      setProcessing(false)
    }
  }

  // Cancel crop
  const handleCancelCrop = () => {
    if (initialCrop) {
      setCrop(initialCrop)
    }
    setCroppedImageUrl(null)
    setHasCropChanged(false)
    setSelectedAspectRatio('Free')
  }

  // Reset crop
  const handleResetCrop = () => {
    setCroppedImageUrl(null)
    
    if (imgRef.current && imageDimensions) {
      const resetCrop: CropType = {
        unit: '%',
        width: 60,
        height: 60,
        x: 20,
        y: 20,
      }
      setCrop(resetCrop)
      setSelectedAspectRatio('Free')
      setHasCropChanged(false)
    }
  }

  const handleNext = async () => {
    if (croppedImageUrl) {
      await addVersion({
        type: 'crop',
        imageUrl: croppedImageUrl,
        parent: currentVersion!.id,
        metadata: {
          cropSettings: {
            crop,
            aspectRatio: selectedAspectRatio,
            imageDimensions
          }
        }
      })
    }
    
    router.push('/edit/meta')
  }

  // Show loading state while store is hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-abb-red mx-auto mb-4"></div>
          <p className="text-gray-600">Loading store...</p>
        </div>
      </div>
    )
  }

  // Show error state if no current version
  if (!currentVersion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">🖼️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Image Found</h2>
          <p className="text-gray-600 mb-4">Please upload an image first to use the crop feature.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-abb-red text-white rounded-md hover:bg-red-700"
          >
            Go to Upload
          </button>
        </div>
      </div>
    )
  }

  const displayImageUrl = croppedImageUrl || currentVersion.imageUrl
  const canApplyCrop = crop && hasCropChanged && !isCropping && !croppedImageUrl
  
  return (
    <EditorLayout currentStep="crop">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Crop Image
          </h2>
          <p className="text-gray-600">
            Resize and crop your image with manual controls and preset aspect ratios, or skip to the next step.
          </p>
        </div>

        {/* Aspect Ratio Presets */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Aspect Ratio (optional)
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleResetCrop}
                className="inline-flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                title="Reset crop area"
              >
                <RotateCcw size={14} className="mr-1" />
                Reset Crop
              </button>
              
              {croppedImageUrl && (
                <button
                  onClick={() => {
                    setCroppedImageUrl(null)
                    setHasCropChanged(false)
                  }}
                  className="inline-flex items-center px-3 py-1 text-sm border border-yellow-300 rounded-md hover:bg-yellow-50 text-yellow-700"
                  title="Restore original image"
                >
                  <RotateCcw size={14} className="mr-1" />
                  Restore Original
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {aspectRatioPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleAspectRatioChange(preset)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200
                  ${selectedAspectRatio === preset.name 
                    ? 'border-abb-red bg-red-50 text-abb-red' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }
                `}
              >
                <span className="text-lg">{preset.icon}</span>
                <span className="font-medium">{preset.name}</span>
                {selectedAspectRatio === preset.name && (
                  <Check size={16} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Image Crop Area */}
        <div className="mb-6">
          <div className="relative rounded-lg overflow-hidden bg-gray-100 min-h-96 flex items-center justify-center">
            {!croppedImageUrl ? (
              <>
                {imageLoading && (
                  <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-abb-red mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium mb-2">Loading image...</p>
                    <p className="text-gray-500 text-sm">This may take a few moments</p>
                    <div className="mt-4 space-y-2">
                      <button
                        onClick={retryImageLoad}
                        className="px-4 py-2 bg-abb-red text-white rounded-md hover:bg-red-700 text-sm mr-2"
                      >
                        Reload Image
                      </button>
                      <button
                        onClick={() => router.push('/edit/meta')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                      >
                        Skip Crop & Continue
                      </button>
                    </div>
                  </div>
                )}
                
                {imageLoadError && (
                  <div className="text-center p-8">
                    <div className="text-red-500 text-6xl mb-4">🖼️</div>
                    <p className="text-red-600 font-medium mb-2">Image failed to load</p>
                    <p className="text-gray-600 text-sm mb-4">The image could not be loaded. This might be due to:</p>
                    <ul className="text-gray-600 text-sm text-left max-w-md mx-auto space-y-1">
                      <li>• Invalid or corrupted image file</li>
                      <li>• Network connectivity issues</li>
                      <li>• CORS restrictions</li>
                    </ul>
                    <div className="flex gap-3 justify-center mt-4">
                      <button
                        onClick={retryImageLoad}
                        className="px-4 py-2 bg-abb-red text-white rounded-md hover:bg-red-700"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={() => router.push('/edit/meta')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                      >
                        Skip to Next Step
                      </button>
                    </div>
                  </div>
                )}
                
                {!imageLoading && !imageLoadError && (
                  <ReactCrop
                    key={`crop-${selectedAspectRatio}`}
                    crop={crop}
                    onChange={handleCropChange}
                    onComplete={handleCropComplete}
                    aspect={selectedAspectRatio === 'Free' ? undefined : aspectRatioPresets.find(p => p.name === selectedAspectRatio)?.ratio || undefined}
                    minWidth={50}
                    minHeight={50}
                    keepSelection
                    ruleOfThirds
                    className="crop-container"
                  >
                    <img
                      ref={imgRef}
                      src={currentVersion.imageUrl}
                      alt="Crop preview"
                      className="max-h-96 w-auto mx-auto transition-opacity duration-300"
                      style={{ 
                        maxWidth: '100%',
                        opacity: imageLoading ? 0.7 : 1
                      }}
                      onLoad={onImageLoad}
                      onError={onImageError}
                      crossOrigin="anonymous"
                      loading="eager"
                      decoding="async"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      fetchPriority="high"
                    />
                  </ReactCrop>
                )}

                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <div className="text-gray-400 text-6xl mb-4">🖼️</div>
                      <p className="text-gray-500">Image loading...</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="relative">
                <img
                  src={displayImageUrl}
                  alt="Cropped image"
                  className="max-h-96 w-auto mx-auto"
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-sm">
                  Cropped
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading Indicator */}
        {isProcessing && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-sm text-blue-800">Processing crop...</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            {!croppedImageUrl && (
              <>
                <button
                  onClick={handleApplyCrop}
                  disabled={!canApplyCrop}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-abb-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCropping ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Cropping...
                    </>
                  ) : (
                    <>
                      <Crop size={20} className="mr-2" />
                      Apply Crop
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleCancelCrop}
                  disabled={!hasCropChanged}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                <button
                  onClick={() => router.push('/edit/meta')}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Skip Crop
                </button>
              </>
            )}
          </div>

          <button
            onClick={handleNext}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Next Step
            <ArrowRight size={20} className="ml-2" />
          </button>
        </div>
      </div>
    </EditorLayout>
  )
}
