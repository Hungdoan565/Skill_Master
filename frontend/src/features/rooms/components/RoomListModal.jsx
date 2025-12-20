/**
 * RoomListModal Component
 * Modal hiển thị danh sách phòng trong một khu
 */

import { X, DoorOpen, Edit2, Trash2, Users, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge, RoomTypeBadge, EquipmentTags } from './';

export function RoomListModal({
    isOpen,
    onClose,
    zone,
    centerName,
    rooms = [],
    onEdit,
    onDelete
}) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <DoorOpen className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">
                                    Khu {zone}
                                </h2>
                                <p className="text-sm text-white/80">
                                    {centerName} • {rooms.length} phòng
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    {rooms.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <DoorOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>Chưa có phòng nào trong khu này</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {rooms.map(room => (
                                <div
                                    key={room.id}
                                    className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-orange-200 transition-all"
                                >
                                    {/* Room Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-slate-900">{room.name}</h3>
                                                <span className="px-2 py-0.5 text-xs font-mono font-medium bg-slate-100 text-slate-600 rounded">
                                                    {room.code}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-4 w-4" />
                                                    <span>{room.capacity} chỗ</span>
                                                </div>
                                                <span className="text-slate-300">•</span>
                                                <span>{room.centers?.name || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => onEdit(room)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => onDelete(room)}
                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Room Details */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <RoomTypeBadge type={room.room_type} />
                                        <StatusBadge status={room.status} />
                                        {room.equipment && room.equipment.length > 0 && (
                                            <EquipmentTags equipment={room.equipment} limit={3} />
                                        )}
                                    </div>

                                    {/* Notes */}
                                    {room.notes && (
                                        <div className="mt-3 pt-3 border-t border-slate-100">
                                            <p className="text-xs text-slate-500 line-clamp-2">{room.notes}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0">
                    <div className="flex justify-end">
                        <Button onClick={onClose} variant="outline">
                            Đóng
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RoomListModal;
