'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, ArrowRight, Download, HelpCircle } from 'lucide-react'
import { useImageStore } from '@/lib/store'
import { generateImageUrl, checkAIGenerated } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function Home() {
  const router = useRouter()
  const { addVersion, setProcessing, setError, getCurrentVersion, versions, isHydrated } = useImageStore()
  const [dragActive, setDragActive] = useState(false)
  const currentVersion = getCurrentVersion()

  const handleFileUpload = async (file: File) => {
    try {
      setProcessing(true)
      setError(null)

      // Generate image URL
      const imageUrl = generateImageUrl(file)
      
      // Perform comprehensive AI detection
      console.log('🔍 Starting AI detection analysis...')
      const aiCheckResult = await checkAIGenerated(file)
      console.log('✅ AI detection completed:', aiCheckResult)
      
      // Show AI detection results to user
      if (aiCheckResult.isAI && aiCheckResult.confidence > 0.8) {
        const shouldContinue = confirm(
          `⚠️ AI-Generated Image Detected!\n\n` +
          `Confidence: ${Math.round(aiCheckResult.confidence * 100)}%\n\n` +
          `This image appears to be AI-generated. Do you want to continue with editing?`
        )
        
        if (!shouldContinue) {
          setProcessing(false)
          return
        }
      }
      
      // Add initial version with AI detection metadata
      await addVersion({
        type: 'upload',
        imageUrl,
        metadata: {
          aiCheckResult,
          originalFileName: file.name,
          fileSize: file.size,
          uploadTimestamp: new Date().toISOString()
        }
      })

      // Navigate to context editing
      router.push('/edit/context')
    } catch (error) {
      console.error('Upload error:', error)
      setError('Failed to upload image. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const navigationItems = [
    { name: 'Edit image context', href: '/edit/context', icon: ArrowRight },
    { name: 'Edit colors', href: '/edit/colors', icon: ArrowRight },
    { name: 'Crop image', href: '/edit/crop', icon: ArrowRight },
    { name: 'Image description', href: '/edit/meta', icon: ArrowRight },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              IMAGE EDITOR - 1.0
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/gallery')}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
              >
                <HelpCircle size={16} />
                Gallery
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Editing Features
              </h2>
              <nav className="space-y-2">
                {navigationItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors",
                      currentVersion 
                        ? "text-gray-700 hover:bg-gray-50 hover:text-gray-900" 
                        : "text-gray-400 cursor-not-allowed"
                    )}
                    onClick={(e) => {
                      if (!currentVersion) {
                        e.preventDefault()
                      }
                    }}
                  >
                    {item.name}
                    <item.icon size={16} />
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-12">
              <div className="text-center">
                <Upload 
                  size={48} 
                  className="mx-auto text-gray-400 mb-4" 
                />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Click or drag file to this area to upload
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Support for a single or bulk upload
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-abb-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
                  >
                    Choose File
                  </label>
                  
                  {isHydrated && versions.length > 0 && (
                    <button
                      onClick={() => router.push('/gallery')}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      <HelpCircle size={16} className="mr-2" />
                      View Gallery ({versions.length})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 