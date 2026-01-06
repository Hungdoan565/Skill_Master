/**
 * StudentSelector - Component for selecting students to notify
 */

import { useState } from 'react';
import {
    Users, Search, CheckSquare, Square,
    ChevronDown, ChevronUp, Loader2,
    BookOpen, GraduationCap, Filter, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '../utils';

export function StudentSelector({
    // Data
    courses,
    classes,
    students,
    coursesWithInfo,
    filteredClasses,
    filteredStudents,
    loadingStudents,

    // Filter state
    filterType,
    setFilterType,
    selectedCourseIds,
    selectedClassIds,
    paymentStatus,
    setPaymentStatus,
    searchQuery,
    setSearchQuery,
    selectedStudentIds,

    // Actions
    fetchStudents,
    toggleCourse,
    toggleClass,
    toggleStudent,
    selectAllStudents,
    deselectAllStudents,
    onContinue,
}) {
    const [expandedCourses, setExpandedCourses] = useState(true);
    const [expandedClasses, setExpandedClasses] = useState(true);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Filters */}
            <div className="lg:col-span-2 space-y-4">
                {/* Filter Type */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Filter className="w-4 h-4 text-orange-500" />
                        Lọc theo
                    </h3>
                    <div className="flex gap-2">
                        {[
                            { value: 'course', label: 'Khóa học', icon: BookOpen },
                            { value: 'class', label: 'Lớp học', icon: GraduationCap },
                            { value: 'all', label: 'Tất cả', icon: Users }
                        ].map(type => (
                            <button
                                key={type.value}
                                onClick={() => {
                                    setFilterType(type.value);
                                }}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all
                                    ${filterType === type.value
                                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                    }
                                `}
                            >
                                <type.icon className="w-4 h-4" />
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Payment Status Filter */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-orange-500" />
                        Trạng thái học phí
                    </h3>
                    <div className="flex gap-2">
                        {[
                            { value: 'owing', label: 'Còn nợ học phí' },
                            { value: 'paid', label: 'Đã thanh toán đủ' },
                            { value: 'all', label: 'Tất cả' }
                        ].map(status => (
                            <button
                                key={status.value}
                                onClick={() => setPaymentStatus(status.value)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all
                                    ${paymentStatus === status.value
                                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                    }
                                `}
                            >
                                {status.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Course Selection */}
                {filterType === 'course' && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <button
                            onClick={() => setExpandedCourses(!expandedCourses)}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
                        >
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-orange-500" />
                                Chọn khóa học ({selectedCourseIds.length}/{courses.length})
                            </h3>
                            {expandedCourses ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                        {expandedCourses && (
                            <div className="border-t border-slate-200 max-h-64 overflow-y-auto">
                                {coursesWithInfo.map(course => (
                                    <div
                                        key={course.id}
                                        onClick={() => toggleCourse(course.id)}
                                        className={`
                                            flex items-center gap-3 p-3 border-b border-slate-100 cursor-pointer
                                            ${selectedCourseIds.includes(course.id) ? 'bg-orange-50' : 'hover:bg-slate-50'}
                                        `}
                                    >
                                        {selectedCourseIds.includes(course.id) ? (
                                            <CheckSquare className="w-5 h-5 text-orange-600" />
                                        ) : (
                                            <Square className="w-5 h-5 text-slate-400" />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">{course.title}</p>
                                            <p className="text-sm text-slate-500">
                                                {course.classCount} lớp • {formatCurrency(course.price)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Class Selection */}
                {filterType === 'class' && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <button
                            onClick={() => setExpandedClasses(!expandedClasses)}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
                        >
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-orange-500" />
                                Chọn lớp học ({selectedClassIds.length}/{classes.length})
                            </h3>
                            {expandedClasses ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                        {expandedClasses && (
                            <div className="border-t border-slate-200 max-h-64 overflow-y-auto">
                                {classes.map(cls => (
                                    <div
                                        key={cls.id}
                                        onClick={() => toggleClass(cls.id)}
                                        className={`
                                            flex items-center gap-3 p-3 border-b border-slate-100 cursor-pointer
                                            ${selectedClassIds.includes(cls.id) ? 'bg-orange-50' : 'hover:bg-slate-50'}
                                        `}
                                    >
                                        {selectedClassIds.includes(cls.id) ? (
                                            <CheckSquare className="w-5 h-5 text-orange-600" />
                                        ) : (
                                            <Square className="w-5 h-5 text-slate-400" />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">{cls.name}</p>
                                            <p className="text-sm text-slate-500">
                                                {cls.courses?.title} • {cls.enrolled_count || 0} học viên
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Fetch Students Button */}
                <Button
                    onClick={fetchStudents}
                    disabled={loadingStudents || (filterType === 'course' && selectedCourseIds.length === 0) || (filterType === 'class' && selectedClassIds.length === 0)}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                    {loadingStudents ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Search className="w-4 h-4 mr-2" />
                    )}
                    Tìm học viên phù hợp
                </Button>
            </div>

            {/* Right: Student List */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <Users className="w-4 h-4 text-orange-500" />
                            Học viên ({selectedStudentIds.length}/{students.length})
                        </h3>
                        {students.length > 0 && (
                            <div className="flex gap-2">
                                <button
                                    onClick={selectAllStudents}
                                    className="text-xs text-orange-600 hover:text-orange-800"
                                >
                                    Chọn tất cả
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                    onClick={deselectAllStudents}
                                    className="text-xs text-slate-500 hover:text-slate-700"
                                >
                                    Bỏ chọn
                                </button>
                            </div>
                        )}
                    </div>
                    {students.length > 0 && (
                        <Input
                            placeholder="Tìm kiếm học viên..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9"
                        />
                    )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                    {loadingStudents ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                        </div>
                    ) : students.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                            <Users className="w-12 h-12 mb-2 text-slate-300" />
                            <p className="text-sm">Chọn bộ lọc và nhấn "Tìm học viên"</p>
                        </div>
                    ) : (
                        filteredStudents.map(student => (
                            <div
                                key={student.enrollment_id}
                                onClick={() => toggleStudent(student.enrollment_id)}
                                className={`
                                    flex items-start gap-3 p-3 border-b border-slate-100 cursor-pointer
                                    ${selectedStudentIds.includes(student.enrollment_id) ? 'bg-orange-50' : 'hover:bg-slate-50'}
                                `}
                            >
                                {selectedStudentIds.includes(student.enrollment_id) ? (
                                    <CheckSquare className="w-5 h-5 text-orange-600 mt-0.5" />
                                ) : (
                                    <Square className="w-5 h-5 text-slate-400 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-900 truncate">{student.full_name}</p>
                                    <p className="text-xs text-slate-500 truncate">{student.email}</p>
                                    <p className="text-xs text-slate-400">{student.class_name}</p>
                                    {student.remaining_amount > 0 && (
                                        <p className="text-xs text-red-600 font-medium">
                                            Nợ: {formatCurrency(student.remaining_amount)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {students.length > 0 && (
                    <div className="p-4 border-t border-slate-200">
                        <Button
                            onClick={onContinue}
                            disabled={selectedStudentIds.length === 0}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500"
                        >
                            Tiếp tục ({selectedStudentIds.length} học viên)
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentSelector;
