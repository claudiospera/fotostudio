import { create } from 'zustand'

interface UIState {
  // Sidebar
  isSidebarOpen: boolean
  openSidebar: () => void
  closeSidebar: () => void

  // Modal states
  isNewGalleryOpen: boolean
  isNewPreventivoOpen: boolean
  isNewUploadLinkOpen: boolean
  isLightboxOpen: boolean
  lightboxPhotoIndex: number

  // Actions
  openNewGallery: () => void
  closeNewGallery: () => void
  openNewPreventivo: () => void
  closeNewPreventivo: () => void
  openNewUploadLink: () => void
  closeNewUploadLink: () => void
  openLightbox: (index: number) => void
  closeLightbox: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),

  isNewGalleryOpen: false,
  isNewPreventivoOpen: false,
  isNewUploadLinkOpen: false,
  isLightboxOpen: false,
  lightboxPhotoIndex: 0,

  openNewGallery: () => set({ isNewGalleryOpen: true }),
  closeNewGallery: () => set({ isNewGalleryOpen: false }),
  openNewPreventivo: () => set({ isNewPreventivoOpen: true }),
  closeNewPreventivo: () => set({ isNewPreventivoOpen: false }),
  openNewUploadLink: () => set({ isNewUploadLinkOpen: true }),
  closeNewUploadLink: () => set({ isNewUploadLinkOpen: false }),
  openLightbox: (index) => set({ isLightboxOpen: true, lightboxPhotoIndex: index }),
  closeLightbox: () => set({ isLightboxOpen: false, lightboxPhotoIndex: 0 }),
}))
