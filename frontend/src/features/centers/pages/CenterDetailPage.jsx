import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    useCenterDetail,
    useCenterRooms,
    useCenterClasses,
    useCenterStaff,
    useCenterRevenue
} from '../hooks';
import {
    CenterHeader,
    CenterQuickStats,
    CenterTabs,
    CenterOverviewTab,
    CenterRoomsTab,
    CenterClassesTab,
    CenterStaffTab,
    CenterRevenueTab,
    CenterFormModal,
    AssignManagerModal,
    DeleteConfirmModal
} from '../components';
import { Loader2 } from 'lucide-react';

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
            toast.error('Không thể tải thông tin cơ sở');
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
        toast.success('Cập nhật cơ sở thành công');
    };

    const handleDeleteSuccess = () => {
        setShowDeleteModal(false);
        toast.success('Xóa cơ sở thành công');
        navigate('/admin/centers');
    };

    const handleAssignManagerSuccess = () => {
        setShowAssignManagerModal(false);
        refetchCenter();
        toast.success('Gán quản lý thành công');
    };

    // Render loading state
    if (centerLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p className="text-gray-500">Đang tải thông tin cơ sở...</p>
                </div>
            </div>
        );
    }

    // Render error state
    if (!center) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Không tìm thấy cơ sở</p>
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
        <div className="space-y-6">
            {/* Header with gradient */}
            <CenterHeader
                center={center}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAssignManager={handleAssignManager}
            />

            {/* Quick Stats - Hybrid Navigation */}
            <CenterQuickStats
                stats={stats}
                centerId={id}
                loading={centerLoading}
                onTabChange={setActiveTab}
            />

            {/* Tab Navigation */}
            <CenterTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {renderTabContent()}
            </div>

            {/* Modals */}
            {showEditModal && (
                <CenterFormModal
                    center={center}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={handleEditSuccess}
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
                    center={center}
                    currentManager={manager}
                    onClose={() => setShowAssignManagerModal(false)}
                    onSuccess={handleAssignManagerSuccess}
                />
            )}
        </div>
    );
};

export default CenterDetailPage;
