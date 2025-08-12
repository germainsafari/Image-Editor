'use client'

import { useState } from 'react'
import { Trash2, Download, Cloud, HardDrive } from 'lucide-react'
import { useImageStore } from '@/lib/store'
import { downloadImage } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface VersionManagerProps {
  className?: string
}

export default function VersionManager({ className }: VersionManagerProps) {
  const { getVersionHistory, getCurrentVersion, setCurrentVersion, deleteVersion } = useImageStore()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  
  const versions = getVersionHistory()
  const currentVersion = getCurrentVersion()

  const handleVersionSelect = (versionId: string) => {
    setCurrentVersion(versionId)
  }

  const handleVersionDelete = async (versionId: string) => {
    if (!confirm('Are you sure you want to delete this version? This action cannot be undone.')) {
      return
    }

    setIsDeleting(versionId)
    try {
      await deleteVersion(versionId)
    } catch (error) {
      console.error('Error deleting version:', error)
    } finally {
      setIsDeleting(null)
    }
  }

  const handleVersionDownload = (version: any) => {
    try {
      const timestamp = version.timestamp instanceof Date ? version.timestamp : new Date(version.timestamp)
      const filename = `version-${version.type}-${timestamp.toISOString().split('T')[0]}.jpg`
      downloadImage(version.imageUrl, filename)
    } catch (error) {
      console.error('Error downloading version:', error)
    }
  }

  const getVersionIcon = (version: any) => {
    if (version.azureBlobPath) {
      return <Cloud size={12} className="text-blue-500" />
    }
    return <HardDrive size={12} className="text-gray-500" />
  }

  const getVersionTypeLabel = (type: string) => {
    switch (type) {
      case 'upload': return 'Original'
      case 'flux': return 'AI Edit'
      case 'color': return 'Color'
      case 'crop': return 'Crop'
      case 'metadata': return 'Metadata'
      default: return type
    }
  }

  if (versions.length === 0) {
    return (
      <div className={cn("bg-white rounded-lg shadow-sm p-6", className)}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Versions</h3>
        <p className="text-sm text-gray-500">No versions yet. Upload an image to get started.</p>
      </div>
    )
  }

  return (
    <div className={cn("bg-white rounded-lg shadow-sm p-6", className)}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Versions</h3>
      <div className="space-y-3">
        {versions.map((version, index) => (
          <div
            key={version.id}
            className={cn(
              "relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
              currentVersion?.id === version.id 
                ? "border-abb-red bg-red-50" 
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <div className="relative">
              <img
                src={version.imageUrl}
                alt={`Version ${index + 1}`}
                className="w-full h-24 object-cover"
                onClick={() => handleVersionSelect(version.id)}
              />
              
              {/* Version Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {getVersionIcon(version)}
                    <span>{getVersionTypeLabel(version.type)}</span>
                  </div>
                  <span className="text-xs opacity-75">
                    {(version.timestamp instanceof Date ? version.timestamp : new Date(version.timestamp)).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleVersionDownload(version)
                  }}
                  className="p-1 bg-white bg-opacity-90 rounded hover:bg-opacity-100 transition-all hover:bg-yellow-100"
                  title="Download version"
                >
                  <Download size={12} className="text-gray-600" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleVersionDelete(version.id)
                  }}
                  disabled={isDeleting === version.id}
                  className="p-1 bg-white bg-opacity-90 rounded hover:bg-red-100 transition-all"
                  title="Delete version"
                >
                  {isDeleting === version.id ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-red-600"></div>
                  ) : (
                    <Trash2 size={12} className="text-red-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Version Metadata */}
            {version.metadata?.prompt && (
              <div className="p-2 bg-gray-50 text-xs text-gray-600">
                <div className="font-medium">Prompt:</div>
                <div className="truncate">{version.metadata.prompt}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Storage Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Total versions: {versions.length}</span>
          <div className="flex items-center gap-1">
            <Cloud size={12} />
            <span>Azure Storage</span>
          </div>
        </div>
      </div>
    </div>
  )
} 