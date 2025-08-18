'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Edit, Trash2, Eye, Calendar, Tag } from 'lucide-react'
import { useImageStore } from '@/lib/store'
import { downloadImage, getProxiedImageUrl } from '@/lib/utils'
import AIDetectionBadge from '@/components/AIDetectionBadge'

export default function GalleryPage() {
  const router = useRouter()
  const { versions, isHydrated, clearVersions, deleteVersion } = useImageStore()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

  // Show loading state while store is hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-abb-red mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </div>
    )
  }

  // Filter images based on type
  const filteredVersions = versions.filter(version => {
    if (filterType === 'all') return true
    return version.type === filterType
  })

  const handleDownload = async (imageUrl: string, version: any) => {
    try {
      const timestamp = version.timestamp instanceof Date ? version.timestamp : new Date(version.timestamp)
      const filename = `image_${version.type}_${timestamp.toISOString().split('T')[0]}.jpg`
      await downloadImage(imageUrl, filename)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleReuse = (version: any) => {
    // Set this version as the current editing target and start a new branch from it
    const store = useImageStore.getState()
    store.setCurrentVersion(version.id)
    store.setBranchRoot(version.id)
    router.push('/edit/context')
  }

  const handleDelete = async (versionId: string) => {
    try {
      await deleteVersion(versionId)
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'upload': 'Original',
      'flux': 'AI Edited',
      'color': 'Color Filter',
      'crop': 'Cropped',
      'meta': 'Final'
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'upload': 'bg-blue-100 text-blue-800',
      'flux': 'bg-purple-100 text-purple-800',
      'color': 'bg-green-100 text-green-800',
      'crop': 'bg-orange-100 text-orange-800',
      'meta': 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Image Gallery</h1>
              <p className="text-gray-600 mt-2">
                View, download, and reuse your edited images
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit size={16} className="mr-2" />
                New Image
              </button>
              {versions.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all images? This action cannot be undone.')) {
                      clearVersions()
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                >
                  <Trash2 size={16} className="mr-2" />
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'upload', 'flux', 'color', 'crop', 'meta'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterType === type
                    ? 'bg-abb-red text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {type === 'all' ? 'All Images' : getTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredVersions.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
              <Eye size={96} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
            <p className="text-gray-600 mb-6">
              {filterType === 'all' 
                ? "You haven't uploaded any images yet." 
                : `No ${getTypeLabel(filterType).toLowerCase()} images found.`
              }
            </p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-abb-red hover:bg-red-700"
            >
              Upload Your First Image
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVersions.map((version) => (
              <div
                key={version.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="relative aspect-square bg-gray-100">
                                     <img
                     src={getProxiedImageUrl(version.imageUrl)}
                     alt={`${getTypeLabel(version.type)} image`}
                     className="w-full h-full object-cover"
                     onError={(e) => {
                       const target = e.target as HTMLImageElement
                       target.style.display = 'none'
                     }}
                   />
                  
                                     {/* Type Badge */}
                   <div className="absolute top-2 left-2">
                     <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(version.type)}`}>
                       {getTypeLabel(version.type)}
                     </span>
                   </div>

                                      {/* AI Detection Badge */}
                   {version.metadata?.aiCheckResult && (
                     <div className="absolute top-2 right-2">
                       <AIDetectionBadge result={version.metadata.aiCheckResult} />
                     </div>
                   )}

                   {/* Action Buttons */}
                   <div className="absolute bottom-2 right-2 flex gap-1">
                    <button
                      onClick={() => handleDownload(version.imageUrl, version)}
                      className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                      title="Download"
                    >
                      <Download size={14} className="text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleReuse(version)}
                      className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                      title="Reuse for editing"
                    >
                      <Edit size={14} className="text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(version.id)}
                      className="p-1 bg-white rounded shadow-sm hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 size={14} className="text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {version.metadata?.title || `${getTypeLabel(version.type)} Image`}
                    </h3>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <Calendar size={12} className="mr-1" />
                    {formatDate(version.timestamp instanceof Date ? version.timestamp.toISOString() : new Date(version.timestamp).toISOString())}
                  </div>

                  {version.metadata?.tags && version.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {version.metadata.tags.slice(0, 3).map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                        >
                          <Tag size={10} className="mr-1" />
                          {tag}
                        </span>
                      ))}
                      {version.metadata.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{version.metadata.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {versions.length > 0 && (
          <div className="mt-8 p-4 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Gallery Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-abb-red">{versions.length}</div>
                <div className="text-sm text-gray-600">Total Images</div>
              </div>
              {['upload', 'flux', 'color', 'crop', 'meta'].map((type) => (
                <div key={type}>
                  <div className="text-2xl font-bold text-gray-900">
                    {versions.filter(v => v.type === type).length}
                  </div>
                  <div className="text-sm text-gray-600">{getTypeLabel(type)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 