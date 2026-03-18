/**
 * LogoUpload Component - Upload và preview logo trung tâm
 */

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export function LogoUpload({
    value = '',
    onChange,
    centerId = null,
    disabled = false
}) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [preview, setPreview] = useState(value);
    const fileInputRef = useRef(null);

    // Handle file selection
    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)');
            return;
        }

        // Validate file size
        if (file.size > MAX_SIZE) {
            setError('Kích thước file tối đa 2MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target.result);
        };
        reader.readAsDataURL(file);

        // Upload to Supabase Storage
        await uploadFile(file);
    };

    // Upload file to Supabase Storage
    const uploadFile = async (file) => {
        setUploading(true);
        setError(null);

        try {
            // Generate unique filename
            const ext = file.name.split('.').pop();
            const fileName = `center-logo-${centerId || Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const filePath = `center-logos/${fileName}`;

            // Upload to Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from('upload')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) {
                // If bucket doesn't exist, fallback to URL input
                console.warn('Storage upload failed:', uploadError.message);
                setError('Không thể upload. Vui lòng nhập URL trực tiếp.');
                setPreview(null);
                return;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('upload')
                .getPublicUrl(filePath);

            // Update parent
            onChange?.(publicUrl);
            setPreview(publicUrl);

        } catch (err) {
            console.error('Upload error:', err);
            setError('Lỗi upload. Vui lòng thử lại.');
            setPreview(value); // Revert to original
        } finally {
            setUploading(false);
        }
    };

    // Handle URL input change (fallback)
    const handleUrlChange = (e) => {
        const url = e.target.value;
        onChange?.(url);
        setPreview(url);
        setError(null);
    };

    // Remove current logo
    const handleRemove = () => {
        setPreview(null);
        onChange?.('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Trigger file input
    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-3">
            {/* Preview area */}
            <div className="relative">
                {preview ? (
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50">
                            <img
                                src={preview}
                                alt="Logo preview"
                                className="w-full h-full object-cover"
                                onError={() => {
                                    setError('Không thể tải ảnh từ URL này');
                                    setPreview(null);
                                }}
                            />
                        </div>
                        {/* Remove button */}
                        {!disabled && (
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        {/* Success indicator */}
                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center">
                            <CheckCircle className="h-4 w-4" />
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={triggerFileInput}
                        disabled={disabled || uploading}
                        className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                                <span className="text-xs text-gray-500">Đang tải...</span>
                            </>
                        ) : (
                            <>
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <ImageIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <span className="text-xs text-gray-500">Chọn ảnh</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                onChange={handleFileSelect}
                disabled={disabled || uploading}
                className="hidden"
            />

            {/* URL fallback input */}
            <div className="flex items-center gap-2">
                <input
                    type="url"
                    value={value || ''}
                    onChange={handleUrlChange}
                    disabled={disabled || uploading}
                    placeholder="Hoặc nhập URL ảnh..."
                    className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                {!preview && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={triggerFileInput}
                        disabled={disabled || uploading}
                        className="shrink-0"
                    >
                        <Upload className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Help text */}
            <p className="text-xs text-gray-500">
                Định dạng: JPG, PNG, GIF, WebP. Tối đa 2MB.
            </p>
        </div>
    );
}

export default LogoUpload;
