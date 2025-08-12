'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Crop, Check, ArrowRight, RotateCcw } from 'lucide-react'
import ReactCrop, { Crop as CropType, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import EditorLayout from '@/components/EditorLayout'
import { useImageStore } from '@/lib/store'
import { cropImage, getProxiedImageUrl } from '@/lib/utils'

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
    const { width, height } = e.currentTarget
    console.log('Image loaded successfully:', { width, height })
    
    setImageDimensions({ width, height })
    setImageLoading(false)
    setImageLoadError(false)
    
    // Create initial crop (80% of image, centered)
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80,
          height: 80,
        },
        16 / 9, // Default aspect ratio
        width,
        height
      ),
      width,
      height
    )
    
    setCrop(initialCrop)
    setInitialCrop(initialCrop)
    setHasCropChanged(false)
  }, [])

  // Handle image load error
  const onImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Image failed to load:', e.currentTarget.src)
    setImageLoadError(true)
    setImageLoading(false)
    setError('Failed to load image. Please check the image URL or try refreshing the page.')
  }, [setError])

  // Retry loading image with different strategies
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

  // Reset loading states when currentVersion changes
  useEffect(() => {
    if (currentVersion) {
      setImageLoading(true)
      setImageLoadError(false)
      setError(null)
    }
  }, [currentVersion, setError])

  // Set initial loading state
  useEffect(() => {
    if (currentVersion && !imageDimensions) {
      setImageLoading(true)
    }
  }, [currentVersion, imageDimensions])

  // Handle aspect ratio change
  const handleAspectRatioChange = useCallback((preset: typeof aspectRatioPresets[0]) => {
    setSelectedAspectRatio(preset.name)
    setHasCropChanged(true)
    
    if (!imageDimensions) return

    if (preset.name === 'Original') {
      // Restore full image selection
      const fullCrop: CropType = {
        unit: '%',
        width: 100,
        height: 100,
        x: 0,
        y: 0,
      }
      setCrop(fullCrop)
      return
    }

    if (preset.name === 'Free') {
      // Remove aspect ratio constraint
      setCrop(prev => {
        if (!prev) return prev
        // Create a new crop object without aspect ratio constraint
        return {
          ...prev,
          unit: prev.unit,
          width: prev.width,
          height: prev.height,
          x: prev.x,
          y: prev.y
        }
      })
      return
    }

    if (preset.ratio) {
      // Create new crop with selected aspect ratio
      const newCrop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 80,
            height: 80,
          },
          preset.ratio,
          imageDimensions.width,
          imageDimensions.height
        ),
        imageDimensions.width,
        imageDimensions.height
      )
      setCrop(newCrop)
    }
  }, [imageDimensions])

  // Handle crop change (fires continuously)
  const handleCropChange = useCallback((newCrop: CropType) => {
    setCrop(newCrop)
    
    // Only mark as changed if we have valid dimensions
    if (newCrop && newCrop.width > 0 && newCrop.height > 0) {
      setHasCropChanged(true)
    }
    
    // Debug logging
    if (newCrop) {
      console.log('Crop changed:', {
        x: newCrop.x,
        y: newCrop.y,
        width: newCrop.width,
        height: newCrop.height,
        unit: newCrop.unit
      })
    }
  }, [])

  // Handle crop completion
  const handleCropComplete = useCallback((crop: PixelCrop) => {
    // This fires when the user finishes dragging
    console.log('Crop completed:', crop)
    
    // Ensure we have valid pixel coordinates
    if (crop.width > 0 && crop.height > 0) {
      setHasCropChanged(true)
    }
  }, [])

  // Apply crop
  const handleApplyCrop = async () => {
    if (!crop || !currentVersion || !imageDimensions) {
      console.log('Cannot apply crop:', { crop: !!crop, currentVersion: !!currentVersion, imageDimensions: !!imageDimensions })
      return
    }

    try {
      setIsCropping(true)
      setProcessing(true)
      setError(null)

      // Ensure we have valid crop coordinates
      if (crop.width <= 0 || crop.height <= 0) {
        setError('Invalid crop area. Please adjust the crop selection.')
        return
      }

      console.log('Applying crop with:', { crop, imageDimensions })

      // Actually crop the image using canvas
      const croppedImageUrl = await cropImage(
        currentVersion.imageUrl,
        crop,
        imageDimensions
      )
      
      console.log('Crop successful, new URL:', croppedImageUrl)
      setCroppedImageUrl(croppedImageUrl)
    } catch (error) {
      console.error('Crop error:', error)
      setError('Failed to crop image. Please try again.')
    } finally {
      setIsCropping(false)
      setProcessing(false)
    }
  }

  // Cancel crop
  const handleCancelCrop = () => {
    console.log('Canceling crop, restoring initial crop:', initialCrop)
    if (initialCrop) {
      setCrop(initialCrop)
    }
    setCroppedImageUrl(null)
    setHasCropChanged(false)
    setSelectedAspectRatio('Free')
  }

  // Reset crop - restore original image and reset crop area
  const handleResetCrop = () => {
    // Clear the cropped image to show the original
    setCroppedImageUrl(null)
    
    // Reset to initial crop settings
    if (imgRef.current && imageDimensions) {
      const resetCrop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 80,
            height: 80,
          },
          16 / 9,
          imageDimensions.width,
          imageDimensions.height
        ),
        imageDimensions.width,
        imageDimensions.height
      )
      setCrop(resetCrop)
      setSelectedAspectRatio('Free')
      setHasCropChanged(false)
    }
  }

  const handleNext = async () => {
    if (croppedImageUrl) {
      // Save the cropped image as a new version
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
    
    // Navigate to next step
    router.push('/edit/meta')
  }

  if (!currentVersion) {
    return null
  }

  const displayImageUrl = croppedImageUrl || currentVersion.imageUrl
  const canApplyCrop = crop && hasCropChanged && !isCropping && !croppedImageUrl

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
                     {/* Crop Info */}
           {crop && crop.width > 0 && crop.height > 0 && (
             <div className="mb-3 p-2 bg-gray-50 rounded border text-sm text-gray-600">
               <span className="font-medium">Crop Area:</span> {Math.round(crop.width)} × {Math.round(crop.height)} pixels
               {crop.x !== undefined && crop.y !== undefined && (
                 <span className="ml-4">
                   Position: ({Math.round(crop.x)}, {Math.round(crop.y)})
                 </span>
               )}
             </div>
           )}
           
           {/* Debug Info */}
           {process.env.NODE_ENV === 'development' && currentVersion && (
             <div className="mb-3 p-2 bg-blue-50 rounded border text-xs text-blue-600">
               <span className="font-medium">Debug:</span> Image URL: {currentVersion.imageUrl.substring(0, 50)}...
               <br />
               <span className="font-medium">Status:</span> {imageLoading ? 'Loading' : imageLoadError ? 'Error' : 'Loaded'}
               {imageDimensions && (
                 <span className="ml-4">
                   <span className="font-medium">Dimensions:</span> {imageDimensions.width} × {imageDimensions.height}
                 </span>
               )}
             </div>
           )}
          
                     <div className="relative rounded-lg overflow-hidden bg-gray-100 min-h-96 flex items-center justify-center">
             {!croppedImageUrl ? (
               <>
                 {imageLoading && (
                   <div className="text-center p-8">
                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-abb-red mx-auto mb-4"></div>
                     <p className="text-gray-600">Loading image...</p>
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
                     <button
                       onClick={retryImageLoad}
                       className="mt-4 px-4 py-2 bg-abb-red text-white rounded-md hover:bg-red-700"
                     >
                       Try Again
                     </button>
                   </div>
                 )}
                 
                 {!imageLoading && !imageLoadError && (
                   <ReactCrop
                     crop={crop}
                     onChange={handleCropChange}
                     onComplete={handleCropComplete}
                     aspect={aspectRatioPresets.find(p => p.name === selectedAspectRatio)?.ratio || undefined}
                     minWidth={50}
                     minHeight={50}
                     keepSelection
                     ruleOfThirds
                   >
                     <img
                       ref={imgRef}
                       src={currentVersion.imageUrl.startsWith('blob:') ? currentVersion.imageUrl : getProxiedImageUrl(currentVersion.imageUrl)}
                       alt="Crop preview"
                       className="max-h-96 w-auto mx-auto"
                       style={{ maxWidth: '100%' }}
                       onLoad={onImageLoad}
                       onError={onImageError}
                       crossOrigin="anonymous"
                     />
                   </ReactCrop>
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

        {/* Instructions */}
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="text-sm font-medium text-yellow-900 mb-2">How to Crop</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• <strong>Drag handles:</strong> Click and drag any corner or edge handle to resize</li>
            <li>• <strong>Move crop area:</strong> Click and drag inside the crop rectangle to move it</li>
            <li>• <strong>Aspect ratio:</strong> Select a preset to maintain that ratio while resizing</li>
            <li>• <strong>Free mode:</strong> Select "Free" to resize without aspect ratio constraints</li>
            <li>• <strong>Original:</strong> Select "Original" to restore full image selection</li>
            <li>• <strong>Reset:</strong> Click "Reset" to return to default crop settings</li>
          </ul>
        </div>
      </div>
    </EditorLayout>
  )
} 