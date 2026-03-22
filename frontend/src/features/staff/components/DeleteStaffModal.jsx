/**
 * DeleteStaffModal Component
 * Modal xác nhận xóa/vô hiệu hóa nhân viên
 * Sử dụng ConfirmDialog thay vì native confirm()
 */

import { useState } from 'react';
import { AlertTriangle, Trash2, UserX, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SimpleModal } from './SimpleModal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function DeleteStaffModal({
    isOpen,
    onClose,
    staff,
    onConfirm,
    deleting = false,
}) {
    const [showPermanentConfirm, setShowPermanentConfirm] = useState(false);

    if (!staff) return null;

    const handleSoftDelete = () => {
        onConfirm(staff.id, false); // Soft delete
    };

    const handlePermanentDelete = () => {
        setShowPermanentConfirm(true);
    };

    const confirmPermanentDelete = async () => {
        await onConfirm(staff.id, true); // Permanent delete
        setShowPermanentConfirm(false);
    };

    return (
        <>
            <SimpleModal
                isOpen={isOpen && !showPermanentConfirm}
                onClose={onClose}
                title="Xóa nhân viên"
            >
                <div className="space-y-4">
                    {/* Warning */}
                    <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-amber-800 dark:text-amber-200">
                                Bạn đang xóa nhân viên
                            </p>
                            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                                <strong>{staff.full_name}</strong> ({staff.email})
                            </p>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>Bạn có thể:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>
                                <strong>Vô hiệu hóa</strong>: Tạm ngừng tài khoản, có thể khôi phục sau
                            </li>
                            <li>
                                <strong>Xóa vĩnh viễn</strong>: Xóa hoàn toàn, không thể khôi phục
                            </li>
                        </ul>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col gap-2 border-t border-border pt-4">
                        <Button
                            variant="outline"
                            className="w-full justify-center"
                            onClick={handleSoftDelete}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-foreground/50 border-t-transparent" />
                            ) : (
                                <UserX className="mr-2 h-4 w-4" />
                            )}
                            Vô hiệu hóa (có thể khôi phục)
                        </Button>

                        <Button
                            variant="destructive"
                            className="w-full justify-center"
                            onClick={handlePermanentDelete}
                            disabled={deleting}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa vĩnh viễn
                        </Button>

                        <Button
                            variant="ghost"
                            className="w-full justify-center"
                            onClick={onClose}
                            disabled={deleting}
                        >
                            Hủy
                        </Button>
                    </div>
                </div>
            </SimpleModal>

            {/* Confirm Permanent Delete Dialog */}
            <ConfirmDialog
                isOpen={showPermanentConfirm}
                onClose={() => setShowPermanentConfirm(false)}
                onConfirm={confirmPermanentDelete}
                title="Xác nhận xóa vĩnh viễn"
                message={`Bạn có CHẮC CHẮN muốn xóa vĩnh viễn "${staff.full_name}"? Hành động này KHÔNG THỂ hoàn tác và tất cả dữ liệu liên quan sẽ bị mất!`}
                confirmText="Xóa vĩnh viễn"
                cancelText="Quay lại"
                variant="danger"
                icon={Ban}
            />
        </>
    );
}

export default DeleteStaffModal;
