'use client';

import { useState, useRef } from 'react';
import { Upload, User, X, Check, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AddMemberProps {
  onMemberAdded?: () => void;
}

export default function AddMember({ onMemberAdded }: AddMemberProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setToast({ message: 'Please select a valid image file', type: 'error' });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePhotoChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handlePhotoChange(e.target.files[0]);
    }
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      setToast({ message: 'Please enter both first and last name', type: 'error' });
      return;
    }

    if (!photo) {
      setToast({ message: 'Please upload a photo', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('firstName', firstName.trim());
      formData.append('lastName', lastName.trim());
      formData.append('photo', photo);

      const response = await fetch('/api/members/add', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setToast({ message: `${firstName} ${lastName} added successfully!`, type: 'success' });
        setFirstName('');
        setLastName('');
        clearPhoto();
        onMemberAdded?.();
      } else {
        setToast({ message: data.error || 'Failed to add member', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Failed to add member', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Auto-dismiss toast
  if (toast) {
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Add New Member</h2>
          <p className="text-muted-foreground text-sm">Add a new person to the leaderboard</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium mb-2">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium mb-2">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>

        {/* Photo upload */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Photo
          </label>

          {photoPreview ? (
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20">
                <Image
                  src={photoPreview}
                  alt="Preview"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={clearPhoto}
                className="absolute -top-2 -right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-secondary/50"
              )}
            >
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                <span className="text-primary font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, AVIF up to 10MB
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* Preview card */}
        {firstName && lastName && (
          <div className="bg-secondary/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Preview</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary flex items-center justify-center">
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt="Preview"
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">{firstName} {lastName}</p>
                <p className="text-sm text-muted-foreground">100 points (starting)</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || !firstName || !lastName || !photo}
          className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Adding Member...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Add Member
            </>
          )}
        </button>
      </form>

      {/* Toast */}
      {toast && (
        <div className={cn(
          "mt-4 p-3 rounded-lg text-sm",
          toast.type === 'success' && "bg-green-500/10 text-green-500 border border-green-500/20",
          toast.type === 'error' && "bg-destructive/10 text-destructive border border-destructive/20"
        )}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
