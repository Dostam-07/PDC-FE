import React, { useState } from 'react';
import { UploadCloud, FileText, X, Check, Loader2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ isOpen, onClose }) => {
  const { uploadDocument } = useChat();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);

    try {
      await uploadDocument(selectedFile);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedFile(null);
        setUploading(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Upload error:", err);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white border border-gray-200 text-gray-900 rounded-2xl max-w-md w-full p-5 shadow-xl relative">
        
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-purple-600" />
            <div>
              <h3 className="font-semibold text-sm text-gray-900">Upload Concept Note</h3>
              <p className="text-[11px] text-gray-400">Extract context from Word, PDF, CSV, or TXT</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-5">
          <label className="border-2 border-dashed border-gray-200 hover:border-purple-500 bg-gray-50/70 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.csv,.txt"
              className="hidden"
            />
            
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 mb-2 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>

            <p className="text-xs font-semibold text-gray-800 text-center">
              {selectedFile ? selectedFile.name : 'Click to select or drag & drop document'}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              Supports Word (.docx), PDF, CSV, TXT (Max 25MB)
            </p>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs text-gray-500 hover:text-gray-800"
          >
            Cancel
          </button>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...
              </>
            ) : success ? (
              <>
                <Check className="w-3.5 h-3.5" /> Uploaded!
              </>
            ) : (
              'Upload & Analyze'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
