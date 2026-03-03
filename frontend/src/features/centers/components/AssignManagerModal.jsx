/**
 * AssignManagerModal Component - Modal gán quản lý cho trung tâm
 */

import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Check, User, Mail, Phone, Building2 } from 'lucide-react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { API_URL, getInitials } from '../utils';

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
        headers: {
            Authorization: `Bearer ${session?.access_token}`
        }
    };
}

export function AssignManagerModal({
    isOpen,
    onClose,
    center,
    onAssign,
    loading = false
}) {
    const [staff, setStaff] = useState([]);
    const [filteredStaff, setFilteredStaff] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [loadingStaff, setLoadingStaff] = useState(false);

    // Fetch danh sách nhân viên khi modal mở
    useEffect(() => {
        if (isOpen) {
            fetchStaff();
            setSelectedUserId(center?.manager_id || null);
            setSearch('');
        }
    }, [isOpen, center]);

    // Filter staff khi search thay đổi
    useEffect(() => {
        if (!search.trim()) {
            setFilteredStaff(staff);
        } else {
            const searchLower = search.toLowerCase();
            setFilteredStaff(
                staff.filter(s =>
                    s.full_name?.toLowerCase().includes(searchLower) ||
                    s.email?.toLowerCase().includes(searchLower) ||
                    s.phone?.includes(search)
                )
            );
        }
    }, [search, staff]);

    const fetchStaff = async () => {
        try {
            setLoadingStaff(true);
            const config = await getAuthHeaders();
            // Lấy staff có role là CENTER_MANAGER hoặc SUPER_ADMIN
            const response = await axios.get(
                `${API_URL}/api/admin/staff?role=CENTER_MANAGER,SUPER_ADMIN`,
                config
            );
            if (response.data?.success) {
                setStaff(response.data.data || []);
                setFilteredStaff(response.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching staff:', err);
        } finally {
            setLoadingStaff(false);
        }
    };

    const handleAssign = async () => {
        await onAssign(selectedUserId);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <UserPlus className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Gán quản lý trung tâm
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {center?.name}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="px-6 py-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm theo tên, email, SĐT..."
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Staff list */}
                    <div className="overflow-y-auto max-h-[400px]">
                        {loadingStaff ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
                                <p className="mt-2 text-gray-500">Đang tải...</p>
                            </div>
                        ) : filteredStaff.length === 0 ? (
                            <div className="p-8 text-center">
                                <User className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500">
                                    {search ? 'Không tìm thấy nhân viên phù hợp' : 'Chưa có nhân viên nào'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {/* Option: Không gán ai */}
                                <button
                                    onClick={() => setSelectedUserId(null)}
                                    className={`w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${selectedUserId === null ? 'bg-indigo-50' : ''
                                        }`}
                                >
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                        <User className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-medium text-gray-900">Không gán quản lý</p>
                                        <p className="text-sm text-gray-500">Xóa quản lý hiện tại</p>
                                    </div>
                                    {selectedUserId === null && (
                                        <Check className="h-5 w-5 text-indigo-600" />
                                    )}
                                </button>

                                {/* Staff list */}
                                {filteredStaff.map((person) => (
                                    <button
                                        key={person.id}
                                        onClick={() => setSelectedUserId(person.id)}
                                        className={`w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${selectedUserId === person.id ? 'bg-indigo-50' : ''
                                            }`}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                            {person.avatar_url ? (
                                                <img
                                                    src={person.avatar_url}
                                                    alt={person.full_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-lg font-medium text-gray-600">
                                                    {getInitials(person.full_name)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-gray-900">{person.full_name}</p>
                                                <Badge className="text-xs bg-gray-100 text-gray-600 border-0">
                                                    {person.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Quản lý'}
                                                </Badge>
                                                {center?.manager_id === person.id && (
                                                    <Badge className="text-xs bg-green-100 text-green-700 border-0">
                                                        Hiện tại
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                {person.email && (
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {person.email}
                                                    </span>
                                                )}
                                                {person.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {person.phone}
                                                    </span>
                                                )}
                                            </div>
                                            {person.center_name && person.center_id !== center?.id && (
                                                <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                                                    <Building2 className="h-3 w-3" />
                                                    Đang quản lý: {person.center_name}
                                                </div>
                                            )}
                                        </div>
                                        {selectedUserId === person.id && (
                                            <Check className="h-5 w-5 text-indigo-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleAssign}
                            disabled={loading}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span>
                                    Đang xử lý...
                                </>
                            ) : (
                                'Xác nhận'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AssignManagerModal;
