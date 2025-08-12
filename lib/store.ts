import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ImageVersion {
  id: string
  type: 'upload' | 'flux' | 'color' | 'crop' | 'metadata'
  timestamp: Date
  imageUrl: string
  azureBlobPath?: string // Path in Azure Blob Storage
  metadata?: {
    prompt?: string
    colorSettings?: any
    cropSettings?: any
    tags?: string[]
    description?: string
    title?: string
    originalFileName?: string
    fileSize?: number
    uploadTimestamp?: string
    aiCheckResult?: {
      isAI: boolean
      confidence: number
    }
    // New naming convention fields
    divisionName?: string
    assetType?: string
    campaignName?: string
    format?: string
    ratio?: string
    customNaming?: string
    azureMetadata?: Record<string, string> // Azure Blob metadata
  }
  parent?: string
}

interface ImageEditorState {
  currentVersion: string | null
  versions: ImageVersion[]
  isProcessing: boolean
  error: string | null
  isHydrated: boolean // Track if store has been hydrated from localStorage
  
  // Actions
  addVersion: (version: Omit<ImageVersion, 'id' | 'timestamp'>) => Promise<void>
  setCurrentVersion: (versionId: string) => void
  setProcessing: (processing: boolean) => void
  setError: (error: string | null) => void
  clearVersions: () => void
  getCurrentVersion: () => ImageVersion | null
  getVersionHistory: () => ImageVersion[]
  loadVersionFromAzure: (versionId: string) => Promise<ImageVersion | null>
  deleteVersion: (versionId: string) => Promise<void>
  setHydrated: (hydrated: boolean) => void
}

export const useImageStore = create<ImageEditorState>()(
  persist(
    (set, get) => ({
      currentVersion: null,
      versions: [],
      isProcessing: false,
      error: null,
      isHydrated: false,

      addVersion: async (version) => {
        try {
          const newVersion: ImageVersion = {
            ...version,
            id: `v${Date.now()}`,
            timestamp: new Date(),
          }

          // Upload to Azure Blob Storage if we have a blob URL
          if (newVersion.imageUrl.startsWith('blob:')) {
            try {
              // Convert blob URL to base64 data URL
              const response = await fetch(newVersion.imageUrl)
              const blob = await response.blob()
              const reader = new FileReader()
              
              const base64Promise = new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(blob)
              })
              
              const base64DataUrl = await base64Promise
              
              // Call the API route to upload to Azure
              const uploadResponse = await fetch('/api/upload-version', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  imageUrl: base64DataUrl,
                  versionId: newVersion.id,
                  type: newVersion.type,
                  parent: newVersion.parent || '',
                  prompt: newVersion.metadata?.prompt || '',
                  metadata: newVersion.metadata?.azureMetadata || {}
                })
              })

              if (uploadResponse.ok) {
                const result = await uploadResponse.json()
                
                // Update the version with Azure URL and path
                newVersion.imageUrl = result.azureUrl
                newVersion.azureBlobPath = result.azureBlobPath
                newVersion.metadata = {
                  ...newVersion.metadata,
                  azureMetadata: {
                    versionId: newVersion.id,
                    type: newVersion.type,
                    parent: newVersion.parent || '',
                    prompt: newVersion.metadata?.prompt || '',
                    timestamp: newVersion.timestamp.toISOString(),
                    ...newVersion.metadata?.azureMetadata
                  }
                }
                
                console.log('✅ Image uploaded to Azure successfully:', result.message)
              } else {
                const errorData = await uploadResponse.json()
                console.warn('⚠️ Azure upload failed, keeping image in local storage:', errorData.error)
              }
            } catch (error) {
              console.error('❌ Failed to upload to Azure Blob Storage:', error)
              // Continue with local blob URL if Azure upload fails
            }
          }
          
          set((state) => ({
            versions: [...state.versions, newVersion],
            currentVersion: newVersion.id,
            error: null,
          }))
        } catch (error) {
          console.error('Error adding version:', error)
          set({ error: 'Failed to save image version' })
        }
      },

      setCurrentVersion: (versionId) => {
        set({ currentVersion: versionId })
      },

      setProcessing: (processing) => {
        set({ isProcessing: processing })
      },

      setError: (error) => {
        set({ error })
      },

      clearVersions: () => {
        set({ versions: [], currentVersion: null, error: null })
      },

      getCurrentVersion: () => {
        const { currentVersion, versions } = get()
        return versions.find(v => v.id === currentVersion) || null
      },

      getVersionHistory: () => {
        return get().versions
      },

      loadVersionFromAzure: async (versionId: string) => {
        try {
          const versions = get().versions
          const version = versions.find(v => v.id === versionId)
          
          if (!version || !version.azureBlobPath) {
            return null
          }

          // Call the API route to download from Azure
          const response = await fetch(`/api/azure-storage?action=download&filename=${encodeURIComponent(version.azureBlobPath)}`)
          
          if (response.ok) {
            const imageData = await response.text()
            
            // Create a new version with the downloaded image
            const downloadedVersion: ImageVersion = {
              ...version,
              imageUrl: imageData,
              timestamp: new Date()
            }

            return downloadedVersion
          } else {
            console.warn('⚠️ Failed to load version from Azure:', response.statusText)
            return null
          }
        } catch (error) {
          console.error('❌ Error loading version from Azure:', error)
          return null
        }
      },

      deleteVersion: async (versionId: string) => {
        try {
          const versions = get().versions
          const version = versions.find(v => v.id === versionId)
          
          if (version?.azureBlobPath) {
            // Call the API route to delete from Azure
            try {
              const response = await fetch(`/api/azure-storage?action=delete&filename=${encodeURIComponent(version.azureBlobPath)}`, {
                method: 'DELETE'
              })
              
              if (response.ok) {
                console.log('✅ Image deleted from Azure successfully')
              } else {
                console.warn('⚠️ Failed to delete image from Azure:', response.statusText)
              }
            } catch (error) {
              console.warn('⚠️ Failed to delete image from Azure:', error)
            }
          }

          set((state) => ({
            versions: state.versions.filter(v => v.id !== versionId),
            currentVersion: state.currentVersion === versionId ? null : state.currentVersion
          }))
        } catch (error) {
          console.error('Error deleting version:', error)
          set({ error: 'Failed to delete image version' })
        }
      },

      setHydrated: (hydrated: boolean) => {
        set({ isHydrated: hydrated })
      },
    }),
    {
      name: 'image-editor-storage', // unique name for localStorage key
      partialize: (state) => ({
        // Only persist these fields, not the processing/error states
        currentVersion: state.currentVersion,
        versions: state.versions,
      }),
      onRehydrateStorage: () => (state) => {
        // Set hydrated to true when rehydration is complete
        if (state) {
          state.setHydrated(true)
          
          // Clean up any invalid blob URLs in stored versions
          const versions = state.versions
          const hasInvalidBlobUrls = versions.some(v => v.imageUrl.startsWith('blob:'))
          
          if (hasInvalidBlobUrls) {
            console.warn('Found invalid blob URLs in stored versions, clearing store')
            state.clearVersions()
          }
        }
      },
    }
  )
) 