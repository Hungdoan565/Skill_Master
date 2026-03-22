/**
 * PaymentProofModal Component  
 * Modal upload chứng từ thanh toán và đánh dấu đã thanh toán
 */

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Image, CreditCard, FileText, Loader2, CheckCircle, ChevronDown, Building2, Wallet, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency, formatMonthYear } from '../utils';

// Custom IconSelect Component
function IconSelect({ value, onChange, options, placeholder, icon: Icon }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 w-full h-10 px-3 rounded-md border border-input bg-background hover:bg-muted/50 transition-colors text-sm text-foreground justify-between"
            >
                <div className="flex items-center gap-2">
                    {selectedOption?.icon ? (
                        <selectedOption.icon className={`h-4 w-4 ${selectedOption.iconColor}`} />
                    ) : Icon ? (
                        <Icon className="h-4 w-4 text-muted-foreground" />
                    ) : null}
                    <span>{selectedOption?.label || placeholder}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover text-popover-foreground rounded-md border border-border shadow-lg z-50 py-1">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center gap-2 transition-colors ${value === option.value ? 'bg-muted/50 font-medium' : ''
                                }`}
                        >
                            {option.icon && <option.icon className={`h-4 w-4 ${option.iconColor || 'text-muted-foreground'}`} />}
                            <span>{option.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

const PAYMENT_METHODS = [
    { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng', icon: Building2, iconColor: 'text-blue-600' },
    { value: 'cash', label: 'Tiền mặt', icon: Banknote, iconColor: 'text-green-600' },
    { value: 'e_wallet', label: 'Ví điện tử', icon: Wallet, iconColor: 'text-purple-600' },
];

export function PaymentProofModal({
    isOpen,
    onClose,
    payroll,
    onSubmit,
    submitting = false,
}) {
    const [formData, setFormData] = useState({
        payment_method: 'bank_transfer',
        payment_reference: '',
    });
    const [proofFile, setProofFile] = useState(null);
    const [proofPreview, setProofPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setUploadError('Chỉ chấp nhận file ảnh (PNG, JPG, JPEG)');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('File không được vượt quá 5MB');
            return;
        }

        setUploadError(null);
        setProofFile(file);

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setProofPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveFile = () => {
        setProofFile(null);
        setProofPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!payroll) return;

        try {
            setUploading(true);
            setUploadError(null);

            let payment_proof_url = null;

            // Upload to Supabase Storage if file exists
            if (proofFile) {
                const fileExt = proofFile.name.split('.').pop();
                const fileName = `${payroll.id}-${Date.now()}.${fileExt}`;
                const filePath = `payroll-proofs/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('payroll-proofs')
                    .upload(filePath, proofFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    // If bucket doesn't exist, try creating it or use fallback
                    console.error('Upload error:', uploadError);
                    // Convert to base64 as fallback
                    payment_proof_url = proofPreview;
                } else {
                    // Get public URL
                    const { data: urlData } = supabase.storage
                        .from('payroll-proofs')
                        .getPublicUrl(filePath);
                    payment_proof_url = urlData?.publicUrl;
                }
            }

            // Submit to API
            await onSubmit(payroll.id, {
                payment_proof_url,
                payment_method: formData.payment_method,
                payment_reference: formData.payment_reference,
            });

        } catch (error) {
            console.error('Error submitting payment proof:', error);
            setUploadError('Lỗi khi gửi chứng từ. Vui lòng thử lại.');
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen || !payroll) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-lg rounded-lg bg-card border border-border text-foreground shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-6 py-4 sticky top-0 bg-card">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Xác nhận thanh toán
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Payroll Info */}
                    <div className="space-y-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-emerald-700 dark:text-emerald-300">
                                {formatMonthYear(payroll.period_month, payroll.period_year)}
                            </span>
                            <span className="text-sm text-emerald-700 dark:text-emerald-300">
                                {payroll.teacher?.full_name}
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                            {formatCurrency(payroll.net_salary)}
                        </div>
                    </div>

                    {/* Bank Info (if available) */}
                    {payroll.teacher?.bank_name && (
                        <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
                            <h4 className="text-sm font-medium text-muted-foreground">Thông tin tài khoản nhận</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Ngân hàng:</span>
                                    <span className="ml-2 font-medium">{payroll.teacher.bank_name}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">STK:</span>
                                    <span className="ml-2 font-mono">{payroll.teacher.bank_account_number}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-muted-foreground">Chủ TK:</span>
                                    <span className="ml-2 font-medium">{payroll.teacher.bank_account_holder}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Method */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-slate-500" />
                            Phương thức thanh toán
                        </Label>
                        <IconSelect
                            value={formData.payment_method}
                            onChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                            options={PAYMENT_METHODS}
                            placeholder="Chọn phương thức"
                            icon={CreditCard}
                        />
                    </div>

                    {/* Payment Reference */}
                    <div className="space-y-2">
                        <Label htmlFor="payment_reference" className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-500" />
                            Mã giao dịch / Tham chiếu
                        </Label>
                        <Input
                            id="payment_reference"
                            placeholder="VD: FT24011234567890"
                            value={formData.payment_reference}
                            onChange={(e) => setFormData(prev => ({ ...prev, payment_reference: e.target.value }))}
                        />
                    </div>

                    {/* Upload Proof */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Image className="h-4 w-4 text-slate-500" />
                            Ảnh chứng từ thanh toán
                        </Label>

                        {proofPreview ? (
                            <div className="relative">
                                <img
                                    src={proofPreview}
                                    alt="Payment proof preview"
                                    className="w-full max-h-48 rounded-lg border border-border object-contain"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={handleRemoveFile}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="cursor-pointer rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-500/5"
                            >
                                <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                                <p className="text-sm text-foreground">
                                    Click để chọn ảnh chứng từ
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    PNG, JPG tối đa 5MB
                                </p>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {uploadError && (
                            <p className="text-sm text-red-600">{uploadError}</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={submitting || uploading}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting || uploading}
                            className="min-w-[160px] bg-green-600 hover:bg-green-700"
                        >
                            {submitting || uploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Xác nhận đã thanh toán
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PaymentProofModal;
