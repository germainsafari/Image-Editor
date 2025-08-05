'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Wand2, ArrowRight } from 'lucide-react'
import EditorLayout from '@/components/EditorLayout'
import { useImageStore } from '@/lib/store'
import { callFluxKontextAPI, getProxiedImageUrl } from '@/lib/utils'

export default function ContextEditPage() {
  const router = useRouter()
  const { getCurrentVersion, addVersion, setProcessing, setError, isHydrated } = useImageStore()
  const currentVersion = getCurrentVersion()
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim() || !currentVersion) return

    try {
      setIsGenerating(true)
      setProcessing(true)
      setError(null)

      // Call Flux Kontext API
      const newImageUrl = await callFluxKontextAPI(currentVersion.imageUrl, prompt)
      setGeneratedImageUrl(newImageUrl)
    } catch (error) {
      console.error('Generation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate image. Please try again.')
    } finally {
      setIsGenerating(false)
      setProcessing(false)
    }
  }

  const handleNext = async () => {
    if (generatedImageUrl) {
      // Save the generated image as a new version
      await addVersion({
        type: 'flux',
        imageUrl: generatedImageUrl,
        parent: currentVersion!.id,
        metadata: {
          prompt: prompt
        }
      })
    }
    
    // Navigate to next step
    router.push('/edit/colors')
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
    // Use useEffect to avoid setState during render
    useEffect(() => {
      router.push('/')
    }, [router])
    return null
  }

  const displayImageUrl = generatedImageUrl || currentVersion.imageUrl

  return (
    <EditorLayout currentStep="context">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Edit Image Context
          </h2>
          <p className="text-gray-600">
            Use AI to edit your image based on text prompts. Describe what you'd like to change, or skip to the next step.
          </p>
        </div>

        {/* Image Display */}
        <div className="mb-6">
          <div className="relative rounded-lg overflow-hidden bg-gray-100">
            <img
              src={getProxiedImageUrl(displayImageUrl)}
              alt="Current image"
              className="w-full h-auto max-h-96 object-contain mx-auto"
            />
            {generatedImageUrl && (
              <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-sm">
                AI Generated
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

        {/* Prompt Input */}
        <div className="mb-6">
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Describe what you'd like to change
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'Make the background more professional', 'Add a modern office setting', 'Change the lighting to be warmer'"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-abb-red focus:border-abb-red"
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-abb-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 size={20} className="mr-2" />
                  Generate
                </>
              )}
            </button>
          </div>

          <button
            onClick={handleNext}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Next Step
            <ArrowRight size={20} className="ml-2" />
          </button>
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Tips for Better Results</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Be specific about what you want to change</li>
            <li>• Mention style preferences (professional, modern, vintage, etc.)</li>
            <li>• Describe lighting, background, or composition changes</li>
            <li>• Use clear, descriptive language</li>
          </ul>
        </div>
      </div>
    </EditorLayout>
  )
} 