import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getAzureStorageService } from './azure-storage'

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
    aiCheckResult?: {
      isAI: boolean
      confidence: number
    }
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

          // Upload to Azure Blob Storage if we have a blob URL and Azure is configured
          if (newVersion.imageUrl.startsWith('blob:')) {
            try {
              const azureStorage = getAzureStorageService()
              
              // Only attempt upload if Azure is configured
              if (azureStorage.isAzureConfigured()) {
                const filename = azureStorage.generateFilename(newVersion.id, newVersion.type)
                
                // Upload the blob URL to Azure
                const azureUrl = await azureStorage.uploadBlobUrl(
                  newVersion.imageUrl,
                  filename,
                  {
                    versionId: newVersion.id,
                    type: newVersion.type,
                    parent: newVersion.parent || '',
                    prompt: newVersion.metadata?.prompt || '',
                    timestamp: newVersion.timestamp.toISOString(),
                    ...newVersion.metadata?.azureMetadata
                  }
                )
                
                // Update the version with Azure URL and path
                newVersion.imageUrl = azureUrl
                newVersion.azureBlobPath = filename
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
              } else {
                console.log('Azure Storage not configured, keeping image in local storage')
              }
            } catch (error) {
              console.error('Failed to upload to Azure Blob Storage:', error)
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
          const azureStorage = getAzureStorageService()
          const versions = get().versions
          const version = versions.find(v => v.id === versionId)
          
          if (!version || !version.azureBlobPath) {
            return null
          }

          // Check if Azure is configured before attempting download
          if (!azureStorage.isAzureConfigured()) {
            console.warn('Azure Storage not configured, cannot load version from Azure')
            return null
          }

          // Download from Azure Blob Storage
          const imageData = await azureStorage.downloadImage(version.azureBlobPath)
          
          // Create a new version with the downloaded image
          const downloadedVersion: ImageVersion = {
            ...version,
            imageUrl: imageData,
            timestamp: new Date()
          }

          return downloadedVersion
        } catch (error) {
          console.error('Error loading version from Azure:', error)
          return null
        }
      },

      deleteVersion: async (versionId: string) => {
        try {
          const versions = get().versions
          const version = versions.find(v => v.id === versionId)
          
          if (version?.azureBlobPath) {
            const azureStorage = getAzureStorageService()
            // Only attempt to delete from Azure if it's configured
            if (azureStorage.isAzureConfigured()) {
              await azureStorage.deleteImage(version.azureBlobPath)
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