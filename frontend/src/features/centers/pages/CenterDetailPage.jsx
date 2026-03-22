import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gooeyToast } from 'goey-toast';
import {
    useCenterDetail,
    useCenterRooms,
    useCenterClasses,
    useCenterStaff,
    useCenterStudents,
    useCenterRevenue
} from '../hooks';
import {
    CenterHeader,
    CenterQuickStats,
    CenterOverviewTab,
    CenterRoomsTab,
    CenterClassesTab,
    CenterStaffTab,
    CenterStudentsTab,
    CenterRevenueTab,
    CenterFormModal,
    AssignManagerModal,
    DeleteConfirmModal
} from '../components';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CenterDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');

    // Modals state
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAssignManagerModal, setShowAssignManagerModal] = useState(false);

    // Fetch all data using hooks
    const {
        center,
        stats,
        loading: centerLoading,
        error: centerError,
        refetch: refetchCenter
    } = useCenterDetail(id);

    const {
        rooms,
        stats: roomStats,
        loading: roomsLoading
    } = useCenterRooms(id);

    const {
        classes,
        stats: classStats,
        loading: classesLoading
    } = useCenterClasses(id);

    const {
        staff,
        stats: staffStats,
        loading: staffLoading
    } = useCenterStaff(id);

    const {
        students,
        stats: studentStats,
        loading: studentsLoading
    } = useCenterStudents(id);

    const {
        revenue,
        chartData,
        stats: revenueStats,
        loading: revenueLoading
    } = useCenterRevenue(id);

    // Extract manager from center data
    const manager = center?.manager || null;
    const recentActivity = [];

    // Handle errors
    useEffect(() => {
        if (centerError) {
            gooeyToast.error('Không thể tải thông tin cơ sở');
            navigate('/admin/centers');
        }
    }, [centerError, navigate]);

    // Action handlers
    const handleEdit = () => {
        setShowEditModal(true);
    };

    const handleDelete = () => {
        setShowDeleteModal(true);
    };

    const handleAssignManager = () => {
        setShowAssignManagerModal(true);
    };

    const handleEditSuccess = () => {
        setShowEditModal(false);
        refetchCenter();
        gooeyToast.success('Cập nhật cơ sở thành công', {
            description: center?.name || 'Thông tin cơ sở đã được cập nhật',
        });
    };

    const handleDeleteSuccess = () => {
        setShowDeleteModal(false);
        gooeyToast.success('Xóa cơ sở thành công');
        navigate('/admin/centers');
    };

    const handleAssignManagerSuccess = () => {
        setShowAssignManagerModal(false);
        refetchCenter();
        gooeyToast.success('Gán quản lý thành công');
    };

    // Render loading state
    if (centerLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p className="text-muted-foreground">Đang tải thông tin cơ sở...</p>
                </div>
            </div>
        );
    }

    // Render error state
    if (!center) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">Không tìm thấy cơ sở</p>
                    <button
                        onClick={() => navigate('/admin/centers')}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    // Render active tab content
    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <CenterOverviewTab
                        center={center}
                        stats={stats}
                        manager={manager}
                        recentActivity={recentActivity}
                    />
                );
            case 'rooms':
                return (
                    <CenterRoomsTab
                        rooms={rooms}
                        stats={roomStats}
                        loading={roomsLoading}
                        centerId={id}
                    />
                );
            case 'classes':
                return (
                    <CenterClassesTab
                        classes={classes}
                        loading={classesLoading}
                        centerId={id}
                    />
                );
            case 'staff':
                return (
                    <CenterStaffTab
                        staff={staff}
                        loading={staffLoading}
                        centerId={id}
                    />
                );
            case 'students':
                return (
                    <CenterStudentsTab
                        students={students}
                        loading={studentsLoading}
                        centerId={id}
                    />
                );
            case 'revenue':
                return (
                    <CenterRevenueTab
                        revenueData={chartData}
                        statistics={revenueStats}
                        loading={revenueLoading}
                        centerId={id}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header with gradient */}
            <CenterHeader
                center={center}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAssignManager={handleAssignManager}
            />

            {/* Quick Stats behaves as Tab Navigation now */}
            <CenterQuickStats
                stats={{
                    ...stats,
                    students: {
                        ...(stats?.students || {}),
                        total: studentStats?.total ?? stats?.students?.total ?? stats?.students ?? 0
                    }
                }}
                centerId={id}
                loading={centerLoading}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {/* Tab Content with Animation */}
            <div className="min-h-[400px] mt-2">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderTabContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Modals */}
            {showEditModal && (
                <CenterFormModal
                    isOpen={showEditModal}
                    initialData={center}
                    onClose={() => setShowEditModal(false)}
                    onSubmit={async (data) => {
                        try {
                            const { supabase } = await import('@/lib/supabaseClient');
                            const { data: { session } } = await supabase.auth.getSession();
                            const { default: axios } = await import('axios');
                            await axios.put(
                                `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/centers/${center.id}`,
                                data,
                                { headers: { Authorization: `Bearer ${session?.access_token}` } }
                            );
                            handleEditSuccess();
                        } catch (err) {
                            console.error('Error updating center:', err);
                            gooeyToast.error(err.response?.data?.message || 'Cập nhật thất bại');
                        }
                    }}
                />
            )}

            {showDeleteModal && (
                <DeleteConfirmModal
                    center={center}
                    onClose={() => setShowDeleteModal(false)}
                    onSuccess={handleDeleteSuccess}
                />
            )}

            {showAssignManagerModal && (
                <AssignManagerModal
                    isOpen={showAssignManagerModal}
                    center={center}
                    onClose={() => setShowAssignManagerModal(false)}
                    onAssign={async (userId) => {
                        try {
                            const { supabase } = await import('@/lib/supabaseClient');
                            const { data: { session } } = await supabase.auth.getSession();
                            const { default: axios } = await import('axios');
                            await axios.patch(
                                `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/centers/${center.id}/manager`,
                                { manager_id: userId },
                                { headers: { Authorization: `Bearer ${session?.access_token}` } }
                            );
                            handleAssignManagerSuccess();
                        } catch (err) {
                            console.error('Error assigning manager:', err);
                            gooeyToast.error(err.response?.data?.message || 'Gán quản lý thất bại');
                        }
                    }}
                />
            )}
        </div>
    );
};

export default CenterDetailPage;
