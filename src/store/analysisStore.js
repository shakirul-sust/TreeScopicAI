import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAnalysisStore = create(
  persist(
    (set, get) => ({
      // Current analysis state
      uploadedImage: null,
      result: null,
      speciesInfo: null,
      isAnalyzing: false,
      error: null,
      showNotification: true,
      
      // Actions
      startAnalysis: () => set({
        isAnalyzing: true,
        error: null,
      }),
      
      // Set analysis results
      setResults: (result, speciesInfo, uploadedImage) => {
        set({
          result,
          speciesInfo,
          uploadedImage,
          isAnalyzing: false,
          error: null,
          showNotification: true,
        });
      },
      
      // Set error
      setError: (error) => set({
        error,
        isAnalyzing: false,
      }),
      
      // Hide notification without clearing results
      hideNotification: () => set({
        showNotification: false
      }),
      
      // Clear results
      clearResults: () => set({
        uploadedImage: null,
        result: null,
        speciesInfo: null,
        error: null,
        isAnalyzing: false,
        showNotification: true,
      }),
    }),
    {
      name: 'analysis-storage',
      partialize: (state) => ({
        result: state.result,
        speciesInfo: state.speciesInfo,
        uploadedImage: state.uploadedImage,
      }),
    }
  )
);

export default useAnalysisStore; 