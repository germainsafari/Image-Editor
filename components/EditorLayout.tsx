'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Download, HelpCircle } from 'lucide-react'
import { useImageStore } from '@/lib/store'
import { downloadImage } from '@/lib/utils'
import { cn } from '@/lib/utils'
import VersionManager from './VersionManager'

interface EditorLayoutProps {
  children: React.ReactNode
  currentStep: 'context' | 'colors' | 'crop' | 'meta'
}

export default function EditorLayout({ children, currentStep }: EditorLayoutProps) {
  const router = useRouter()
  const { getCurrentVersion, isHydrated } = useImageStore()
  const currentVersion = getCurrentVersion()

  const handleDownload = () => {
    if (currentVersion) {
      downloadImage(currentVersion.imageUrl, `edited-image-${Date.now()}.jpg`)
    }
  }

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  // Avoid hydration mismatches: wait for store hydration before redirecting
  useEffect(() => {
    if (isHydrated && !currentVersion) {
      router.push('/')
    }
  }, [isHydrated, currentVersion, router])

  if (!isHydrated) {
    // Render a stable placeholder during hydration
    return <div className="min-h-screen bg-gray-50" />
  }

  if (!currentVersion) {
    return null
  }

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
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-abb-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Download size={16} className="mr-2" />
                Download ↓
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
                {[
                  { name: 'Edit image context', step: 'context', href: '/edit/context' },
                  { name: 'Edit colors', step: 'colors', href: '/edit/colors' },
                  { name: 'Crop image', step: 'crop', href: '/edit/crop' },
                  { name: 'Image description', step: 'meta', href: '/edit/meta' },
                ].map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors",
                      currentStep === item.step
                        ? "bg-gray-900 text-white"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    {item.name}
                    <ArrowRight size={16} />
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {children}
          </div>

          {/* Right Sidebar - Version Manager */}
          <div className="w-80 flex-shrink-0">
            <VersionManager />
          </div>
        </div>
      </div>
    </div>
  )
} 