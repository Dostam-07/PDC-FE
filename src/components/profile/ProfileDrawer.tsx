import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, Building, MapPin, Globe, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SUPPORTED_LANGUAGES } from '../../utils/i18n';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, logout } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    role: user?.role || '',
    organization: user?.organization || '',
    focusArea: user?.focusArea || '',
    language: user?.language || 'English',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync form data with current user on open
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || '',
        role: user.role || '',
        organization: user.organization || '',
        focusArea: user.focusArea || '',
        language: user.language || 'English',
      });
    }
  }, [user, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fade-in select-none">
      {/* Click outside backdrop to close */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 -z-10" 
        aria-hidden="true" 
      />

      {/* Centered Modal Pop-up Box */}
      <div 
        className="bg-white rounded-2xl border border-gray-200 text-gray-900 w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shadow-2xs">
              {formData.name ? formData.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="font-semibold text-sm text-gray-900 leading-tight">Profile & Context</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Settings and preferences</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 text-xs">
          <div>
            <label htmlFor="profile-name" className="block font-medium text-gray-700 mb-1 flex items-center gap-1.5 cursor-pointer">
              <User className="w-3.5 h-3.5 text-purple-600" /> Full Name
            </label>
            <input
              id="profile-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Dostam A."
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
            />
          </div>

          <div>
            <label htmlFor="profile-role" className="block font-medium text-gray-700 mb-1 flex items-center gap-1.5 cursor-pointer">
              <Briefcase className="w-3.5 h-3.5 text-purple-600" /> Role / Designation
            </label>
            <input
              id="profile-role"
              name="role"
              type="text"
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              placeholder="e.g. State Program Manager"
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
            />
          </div>

          <div>
            <label htmlFor="profile-organization" className="block font-medium text-gray-700 mb-1 flex items-center gap-1.5 cursor-pointer">
              <Building className="w-3.5 h-3.5 text-purple-600" /> Organization
            </label>
            <input
              id="profile-organization"
              name="organization"
              type="text"
              value={formData.organization}
              onChange={(e) => handleChange('organization', e.target.value)}
              placeholder="e.g. State Education Transformation Cell"
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
            />
          </div>

          <div>
            <label htmlFor="profile-language" className="block font-medium text-gray-700 mb-1 flex items-center gap-1.5 cursor-pointer">
              <Globe className="w-3.5 h-3.5 text-purple-600" /> Output Language
            </label>
            <select
              id="profile-language"
              name="language"
              value={formData.language}
              onChange={(e) => handleChange('language', e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all cursor-pointer"
            >
              {Object.entries(SUPPORTED_LANGUAGES).map(([key, def]) => (
                <option key={key} value={key}>
                  {def.nativeLabel} ({def.label})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs sm:text-[13px] transition-all flex items-center justify-center gap-1.5 shadow-xs hover:shadow active:scale-[0.98] cursor-pointer"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
              {savedSuccess ? 'Saved Preferences!' : 'Save Preferences'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
