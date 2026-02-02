/**
 * HolidaysPage - Trang quản lý ngày lễ
 */

import { useEffect, useState } from 'react';
import { Calendar, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useHolidays } from '../hooks';
import { HolidayTable, HolidayFormModal, DeleteHolidayModal } from '../components';

export function HolidaysPage() {
    const { toast } = useToast();
    const currentYear = new Date().getFullYear();
    
    // Filters
    const [year, setYear] = useState(currentYear);
    
    // Modal states
    const [formModal, setFormModal] = useState({ isOpen: false, holiday: null, submitting: false });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, holiday: null, submitting: false });

    const {
        holidays,
        loading,
        error,
        fetchHolidays,
        createHoliday,
        updateHoliday,
        deleteHoliday,
    } = useHolidays();

    // Load holidays when year changes
    useEffect(() => {
        fetchHolidays({ year });
    }, [year, fetchHolidays]);

    // Handle create/edit
    const handleOpenForm = (holiday = null) => {
        setFormModal({ isOpen: true, holiday, submitting: false });
    };

    const handleCloseForm = () => {
        setFormModal({ isOpen: false, holiday: null, submitting: false });
    };

    const handleSubmitForm = async (data) => {
        setFormModal(prev => ({ ...prev, submitting: true }));
        
        let result;
        if (formModal.holiday) {
            result = await updateHoliday(formModal.holiday.id, data);
        } else {
            result = await createHoliday(data);
        }

        if (result.success) {
            toast({
                title: 'Thành công',
                description: formModal.holiday ? 'Đã cập nhật ngày lễ' : 'Đã tạo ngày lễ mới',
            });
            handleCloseForm();
            fetchHolidays({ year });
        } else {
            toast({
                title: 'Lỗi',
                description: result.error,
                variant: 'destructive',
            });
            setFormModal(prev => ({ ...prev, submitting: false }));
        }
    };

    // Handle delete
    const handleOpenDelete = (holiday) => {
        setDeleteModal({ isOpen: true, holiday, submitting: false });
    };

    const handleCloseDelete = () => {
        setDeleteModal({ isOpen: false, holiday: null, submitting: false });
    };

    const handleConfirmDelete = async () => {
        setDeleteModal(prev => ({ ...prev, submitting: true }));
        
        const result = await deleteHoliday(deleteModal.holiday.id);
        
        if (result.success) {
            toast({
                title: 'Thành công',
                description: 'Đã xóa ngày lễ',
            });
            handleCloseDelete();
            fetchHolidays({ year });
        } else {
            toast({
                title: 'Lỗi',
                description: result.error,
                variant: 'destructive',
            });
            setDeleteModal(prev => ({ ...prev, submitting: false }));
        }
    };

    // Generate year options
    const yearOptions = [];
    for (let y = currentYear - 2; y <= currentYear + 5; y++) {
        yearOptions.push(y);
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                            Quản lý ngày lễ
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Thiết lập các ngày lễ/nghỉ cho trung tâm
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => fetchHolidays({ year })}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </Button>
                        <Button
                            onClick={() => handleOpenForm()}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm ngày lễ
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Năm
                            </label>
                            <select
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {yearOptions.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1" />
                        <div className="text-sm text-gray-500">
                            Tổng: <span className="font-medium text-gray-900">{holidays.length}</span> ngày lễ
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {/* Table */}
                <HolidayTable
                    holidays={holidays}
                    loading={loading}
                    onEdit={handleOpenForm}
                    onDelete={handleOpenDelete}
                    onRefresh={() => fetchHolidays({ year })}
                />

                {/* Form Modal */}
                <HolidayFormModal
                    isOpen={formModal.isOpen}
                    onClose={handleCloseForm}
                    holiday={formModal.holiday}
                    onSubmit={handleSubmitForm}
                    submitting={formModal.submitting}
                />

                {/* Delete Modal */}
                <DeleteHolidayModal
                    isOpen={deleteModal.isOpen}
                    onClose={handleCloseDelete}
                    holiday={deleteModal.holiday}
                    onConfirm={handleConfirmDelete}
                    submitting={deleteModal.submitting}
                />
            </div>
        </div>
    );
}

export default HolidaysPage;
