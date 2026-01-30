'use client';

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';

// Constants for validation
const MIN_TEXT_LENGTH = 50;
const MAX_TEXT_LENGTH = 10000;
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface InputFormData {
  projectDescription: string;
  file: File | null;
}

export interface ValidationErrors {
  projectDescription?: string;
  file?: string;
}

interface InputFormProps {
  onDataChange?: (data: InputFormData, errors: ValidationErrors, isValid: boolean) => void;
}

export default function InputForm({ onDataChange }: InputFormProps) {
  const [projectDescription, setProjectDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate project description
  const validateDescription = useCallback((text: string): string | undefined => {
    const trimmed = text.trim();

    if (!trimmed) {
      return 'Project description is required.';
    }

    if (trimmed.length < MIN_TEXT_LENGTH) {
      return `Description must be at least ${MIN_TEXT_LENGTH} characters (${trimmed.length}/${MIN_TEXT_LENGTH}).`;
    }

    if (trimmed.length > MAX_TEXT_LENGTH) {
      return `Description must not exceed ${MAX_TEXT_LENGTH} characters.`;
    }

    // Check for suspicious patterns (honeypot/bot prevention)
    const suspiciousPatterns = [
      /<script/i,
      /<iframe/i,
      /javascript:/i,
      /data:text\/html/i,
      /on\w+\s*=/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(trimmed)) {
        return 'Invalid content detected in description.';
      }
    }

    return undefined;
  }, []);

  // Validate file
  const validateFile = useCallback((selectedFile: File | null): string | undefined => {
    if (!selectedFile) {
      return undefined; // File is optional
    }

    // Check file extension
    const fileName = selectedFile.name.toLowerCase();
    const fileExtension = '.' + fileName.split('.').pop();
    const isValidExtension = ALLOWED_EXTENSIONS.includes(fileExtension);

    // Check MIME type
    const isValidMimeType = ALLOWED_FILE_TYPES.includes(selectedFile.type);

    if (!isValidExtension && !isValidMimeType) {
      return 'Only PDF, DOC, and DOCX files are allowed.';
    }

    // Check file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      return `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`;
    }

    return undefined;
  }, []);

  // Update parent component with current data
  const notifyParent = useCallback((desc: string, selectedFile: File | null, validationErrors: ValidationErrors) => {
    if (onDataChange) {
      const isValid = !validationErrors.projectDescription && !validationErrors.file && desc.trim().length >= MIN_TEXT_LENGTH;
      onDataChange(
        { projectDescription: desc, file: selectedFile },
        validationErrors,
        isValid
      );
    }
  }, [onDataChange]);

  // Handle description change
  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    setProjectDescription(newDescription);

    const descError = validateDescription(newDescription);
    const newErrors = { ...errors, projectDescription: descError };
    setErrors(newErrors);
    notifyParent(newDescription, file, newErrors);
  };

  // Handle file selection
  const handleFileSelect = (selectedFile: File | null) => {
    const fileError = validateFile(selectedFile);

    if (fileError) {
      setErrors({ ...errors, file: fileError });
      notifyParent(projectDescription, null, { ...errors, file: fileError });
      return;
    }

    setFile(selectedFile);
    const newErrors = { ...errors, file: undefined };
    setErrors(newErrors);
    notifyParent(projectDescription, selectedFile, newErrors);
  };

  // Handle file input change
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    handleFileSelect(selectedFile);
  };

  // Handle drag events
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files?.[0] || null;
    handleFileSelect(droppedFile);
  };

  // Handle click on drop zone
  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  // Remove selected file
  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    const newErrors = { ...errors, file: undefined };
    setErrors(newErrors);
    notifyParent(projectDescription, null, newErrors);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get character count color
  const getCharCountColor = () => {
    const length = projectDescription.trim().length;
    if (length < MIN_TEXT_LENGTH) return 'text-amber-500';
    if (length > MAX_TEXT_LENGTH * 0.9) return 'text-red-500';
    return 'text-emerald-500';
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full space-y-6">
      {/* Text Input Section */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label htmlFor="projectDescription" className="text-sm font-semibold text-slate-300 font-mono uppercase tracking-wider">
            Project Brief
          </label>
          <span className="text-xs text-slate-500 font-mono">Markdown supported</span>
        </div>

        <div className="relative group">
          {/* Glow effect behind the input */}
          <div className={`absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-amber-600 rounded-lg blur transition duration-500 ${errors.projectDescription ? 'opacity-30' : 'opacity-10 group-hover:opacity-20'}`}></div>

          <textarea
            id="projectDescription"
            value={projectDescription}
            onChange={handleDescriptionChange}
            placeholder="Describe your project in detail. Include key features, target users, technical requirements, and any constraints..."
            className={`relative w-full h-40 bg-slate-950 border rounded-lg p-4 text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:ring-2 transition-all ${errors.projectDescription
                ? 'border-red-500/50 focus:ring-red-500/50'
                : 'border-slate-800 focus:ring-orange-500/50 hover:border-slate-700'
              }`}
          />
        </div>

        {/* Character count and validation */}
        <div className="flex justify-between items-center text-xs">
          {errors.projectDescription ? (
            <span className="text-red-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.projectDescription}
            </span>
          ) : (
            <span className="text-slate-500">Minimum {MIN_TEXT_LENGTH} characters required</span>
          )}
          <span className={`font-mono ${getCharCountColor()}`}>
            {projectDescription.trim().length} / {MAX_TEXT_LENGTH}
          </span>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-slate-300 font-mono uppercase tracking-wider">
            Attachment (Optional)
          </label>
          <span className="text-xs text-slate-500 font-mono">PDF, DOC, DOCX only</span>
        </div>

        <div className="relative group">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Glow effect */}
          <div className={`absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-amber-600 rounded-lg blur transition duration-500 ${isDragOver ? 'opacity-40' : errors.file ? 'opacity-30' : 'opacity-10 group-hover:opacity-20'
            }`}></div>

          {/* Drop zone */}
          <div
            onClick={handleDropZoneClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative w-full bg-slate-950 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-all cursor-pointer ${isDragOver
                ? 'border-orange-500 bg-slate-900'
                : errors.file
                  ? 'border-red-500/50 hover:border-red-400'
                  : file
                    ? 'border-emerald-500/50 bg-slate-900/50'
                    : 'border-slate-800 hover:border-orange-500/50 hover:bg-slate-900'
              }`}
          >
            {file ? (
              // File selected state
              <div className="flex items-center gap-4 w-full">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="flex-shrink-0 p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Remove file"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              // Empty state
              <>
                <svg className={`w-10 h-10 mb-3 transition-colors ${isDragOver ? 'text-orange-400' : 'text-slate-600 group-hover:text-orange-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className={`font-medium transition-colors ${isDragOver ? 'text-slate-200' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {isDragOver ? 'Drop your file here' : 'Drop your project proposal here'}
                </p>
                <p className="text-sm mt-1 text-slate-600">or click to browse</p>
              </>
            )}
          </div>
        </div>

        {/* File error message */}
        {errors.file && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errors.file}
          </p>
        )}
      </div>
    </div>
  );
}