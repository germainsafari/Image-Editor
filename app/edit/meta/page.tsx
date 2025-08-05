'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tag, Save, Sparkles, Eye } from 'lucide-react'
import EditorLayout from '@/components/EditorLayout'
import { useImageStore } from '@/lib/store'
import { generateImageDescription } from '@/lib/utils'

export default function MetaEditPage() {
  const router = useRouter()
  const { getCurrentVersion, addVersion, setProcessing, setError, isHydrated } = useImageStore()
  const currentVersion = getCurrentVersion()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)

  // Generate AI description on component mount
  useEffect(() => {
    if (currentVersion && !currentVersion.metadata?.description && !hasGenerated) {
      generateAIDescription()
    } else if (currentVersion?.metadata) {
      setTitle(currentVersion.metadata.title || '')
      setDescription(currentVersion.metadata.description || '')
      setTags(currentVersion.metadata.tags || [])
    }
  }, [currentVersion, hasGenerated])

  const generateAIDescription = async () => {
    if (!currentVersion) return

    try {
      setIsGenerating(true)
      setError(null)
      setHasGenerated(true)

      const aiResult = await generateImageDescription(currentVersion.imageUrl)
      
      setTitle(aiResult.title)
      setDescription(aiResult.description)
      setSuggestedTags(aiResult.tags)
      setTags(aiResult.tags)
    } catch (error) {
      console.error('AI generation error:', error)
      setError('Failed to generate AI description. Please try again.')
      setHasGenerated(false)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleToggleSuggestedTag = (tag: string) => {
    if (tags.includes(tag)) {
      handleRemoveTag(tag)
    } else {
      setTags([...tags, tag])
    }
  }

  const handleSave = async () => {
    if (!currentVersion) return

    try {
      setIsSaving(true)
      setProcessing(true)
      setError(null)

      // Add new version with metadata
      await addVersion({
        type: 'metadata',
        imageUrl: currentVersion.imageUrl,
        parent: currentVersion.id,
        metadata: {
          title,
          description,
          tags
        }
      })

      // Navigate to gallery to view all images
      router.push('/gallery')
    } catch (error) {
      setError('Failed to save metadata. Please try again.')
    } finally {
      setIsSaving(false)
      setProcessing(false)
    }
  }

  if (!currentVersion) {
    return null
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
    <EditorLayout currentStep="meta">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Image Description & Tagging
          </h2>
          <p className="text-gray-600">
            AI analyzes your image using OpenAI's advanced vision technology and generates metadata. Edit or add your own content.
          </p>
        </div>

        {/* Image Display */}
        <div className="mb-6">
          <div className="relative rounded-lg overflow-hidden bg-gray-100">
            <img
              src={currentVersion.imageUrl}
              alt="Current image"
              className="w-full h-auto max-h-96 object-contain mx-auto"
            />
            {isGenerating && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">Analyzing image with AI...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Check Result */}
        {currentVersion.metadata?.aiCheckResult && (
          <div className="mb-6">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              AI CHECK: {currentVersion.metadata.aiCheckResult.isAI ? 'AI-Generated' : 'Original'}
              <span className="ml-2 text-xs text-gray-500">
                ({Math.round(currentVersion.metadata.aiCheckResult.confidence * 100)}% confidence)
              </span>
            </div>
          </div>
        )}

        {/* Title Input */}
        <div className="mb-6">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a descriptive title for the image..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-abb-red focus:border-abb-red"
            maxLength={60}
          />
          <div className="mt-1 text-xs text-gray-500">
            {title.length}/60 characters
          </div>
        </div>

        {/* Description Input */}
        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter a detailed description of the image..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-abb-red focus:border-abb-red resize-none"
          />
        </div>

        {/* Tags Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Tags
            </label>
            <button
              onClick={generateAIDescription}
              disabled={isGenerating}
              className="inline-flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <Sparkles size={14} className="mr-1" />
              {isGenerating ? 'Analyzing...' : 'Regenerate with AI'}
            </button>
          </div>

          {/* Current Tags */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-abb-red text-white"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-white hover:text-gray-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Add New Tag */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="Add a new tag..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-abb-red focus:border-abb-red"
            />
            <button
              onClick={handleAddTag}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Add
            </button>
          </div>

          {/* Suggested Tags */}
          {suggestedTags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">AI Suggested Tags</h4>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleToggleSuggestedTag(tag)}
                    className={`
                      px-3 py-1 rounded-full text-sm font-medium border transition-colors
                      ${tags.includes(tag)
                        ? 'bg-abb-red text-white border-abb-red'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-abb-red'
                      }
                    `}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Additional Metadata */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Additional Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Category
              </label>
              <input
                type="text"
                placeholder="e.g., Industrial Automation, Robotics..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-abb-red focus:border-abb-red"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usage Rights
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-abb-red focus:border-abb-red">
                <option>Internal Use Only</option>
                <option>Marketing Materials</option>
                <option>Public Relations</option>
                <option>Technical Documentation</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-abb-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={20} className="mr-2" />
                Save & Complete
              </>
            )}
          </button>
        </div>

        {/* AI Analysis Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center mb-2">
            <Eye size={16} className="text-blue-600 mr-2" />
            <h3 className="text-sm font-medium text-blue-900">AI Image Analysis</h3>
          </div>
          <p className="text-sm text-blue-800 mb-2">
            This image is analyzed using OpenAI's GPT-4 Vision model, providing advanced image recognition and understanding.
          </p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• <strong>Title Generation:</strong> Concise, professional titles (max 60 characters)</li>
            <li>• <strong>Description:</strong> Detailed, corporate-appropriate descriptions</li>
            <li>• <strong>Smart Tagging:</strong> Contextually relevant tags for easy categorization</li>
            <li>• <strong>ABB Focus:</strong> Recognition of ABB brand elements and industrial context</li>
          </ul>
        </div>

        {/* Media Bank Preview */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Media Bank Preview</h3>
          <div className="bg-white p-4 rounded border">
            <h4 className="font-medium text-gray-900 mb-2">{title || 'Untitled Image'}</h4>
            <p className="text-sm text-gray-600 mb-3">{description || 'No description available'}</p>
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 5).map((tag) => (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  {tag}
                </span>
              ))}
              {tags.length > 5 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                  +{tags.length - 5} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </EditorLayout>
  )
} 