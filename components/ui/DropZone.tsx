'use client'

import { useRef, useState, DragEvent } from 'react'

interface DropZoneProps {
  onFiles: (files: File[]) => void
  accept?: string
  multiple?: boolean
  disabled?: boolean
  children?: React.ReactNode
}

export const DropZone = ({ onFiles, accept, multiple = true, disabled = false, children }: DropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: DragEvent<HTMLDivElement>, entering: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(entering)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    const files = Array.from(e.dataTransfer.files)
    if (files.length) onFiles(files)
  }

  const handleChange = () => {
    if (!inputRef.current?.files) return
    onFiles(Array.from(inputRef.current.files))
    inputRef.current.value = ''
  }

  return (
    <div
      onDragEnter={(e) => handleDrag(e, true)}
      onDragLeave={(e) => handleDrag(e, false)}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`
        relative border-2 border-dashed rounded-[var(--r)] p-8 text-center cursor-pointer transition-all duration-150
        ${isDragging
          ? 'border-[var(--ac)] bg-[var(--acd)]'
          : 'border-[var(--b2)] bg-[var(--s2)] hover:border-[var(--b3)] hover:bg-[var(--s3)]'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="sr-only"
      />
      {children ?? (
        <div className="flex flex-col items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-[var(--t3)]">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          <p className="text-sm text-[var(--t2)]">
            <span className="text-[var(--ac)] font-medium">Carica file</span> o trascina qui
          </p>
        </div>
      )}
    </div>
  )
}
