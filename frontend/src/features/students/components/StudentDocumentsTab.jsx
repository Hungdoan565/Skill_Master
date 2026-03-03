import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Upload,
  File,
  FileText,
  Image,
  Trash2,
  Download,
  Eye,
  X,
  Search,
  Plus,
  Loader2,
} from 'lucide-react';
import { gooeyToast } from 'goey-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const DOC_TYPES = {
  personal: { label: 'Cá nhân', color: 'bg-blue-100 text-blue-700' },
  academic: { label: 'Học vụ', color: 'bg-green-100 text-green-700' },
  certificate: { label: 'Chứng chỉ', color: 'bg-purple-100 text-purple-700' },
  medical: { label: 'Y tế', color: 'bg-red-100 text-red-700' },
  other: { label: 'Khác', color: 'bg-slate-100 text-slate-700' },
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getFileIcon = (fileName) => {
  if (!fileName) return File;
  const lower = fileName.toLowerCase();
  if (lower.match(/\.(jpg|jpeg|png|gif|webp)$/)) return Image;
  if (lower.endsWith('.pdf')) return FileText;
  return File;
};

const isPreviewable = (fileName) => {
  if (!fileName) return false;
  return /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(fileName);
};

const extractStoragePathFromPublicUrl = (url) => {
  if (!url) return null;
  const marker = '/storage/v1/object/public/document/';
  const markerIndex = url.indexOf(marker);
  if (markerIndex === -1) return null;
  return url.slice(markerIndex + marker.length);
};

export function StudentDocumentsTab({ studentId, studentName, getHeaders }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!studentId) return;

    setLoading(true);
    try {
      const headers = getHeaders();
      const response = await fetch(`${API_URL}/api/students/${studentId}/documents`, {
        headers,
      });
      const json = await response.json();

      if (json.success) {
        setDocuments(json.data || []);
      }
    } catch (error) {
      console.error('Error fetching student documents:', error);
    } finally {
      setLoading(false);
    }
  }, [studentId, getHeaders]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredDocuments = useMemo(() => {
    let result = documents;

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter((doc) =>
        doc.title?.toLowerCase().includes(term) ||
        doc.file_name?.toLowerCase().includes(term) ||
        doc.notes?.toLowerCase().includes(term)
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter((doc) => doc.type === typeFilter);
    }

    return result;
  }, [documents, searchTerm, typeFilter]);

  const handleDelete = async (doc) => {
    if (!window.confirm(`Bạn có chắc muốn xóa "${doc.title}"?`)) return;

    try {
      const headers = getHeaders();
      const storagePath = extractStoragePathFromPublicUrl(doc.file_url);

      if (storagePath) {
        await supabase.storage.from('document').remove([storagePath]);
      }

      const response = await fetch(`${API_URL}/api/documents/${doc.id}`, {
        method: 'DELETE',
        headers,
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Không thể xóa tài liệu');
      }

      setDocuments((prev) => prev.filter((item) => item.id !== doc.id));
    } catch (error) {
      console.error('Error deleting student document:', error);
      gooeyToast.error(error.message || 'Không thể xóa tài liệu');
    }
  };

  const handleDownload = (doc) => {
    if (!doc.file_url) return;
    window.open(doc.file_url, '_blank');
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Tài liệu học viên</h3>
          <p className="text-sm text-slate-500">
            {documents.length} tài liệu • {studentName || 'Học viên'}
          </p>
        </div>

        <Button onClick={() => setShowUploadModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm tài liệu
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Tìm kiếm tài liệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Lọc loại tài liệu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {Object.entries(DOC_TYPES).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Đang tải tài liệu...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            {searchTerm ? 'Không tìm thấy tài liệu phù hợp' : 'Chưa có tài liệu nào'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredDocuments.map((doc) => {
            const typeConfig = DOC_TYPES[doc.type] || DOC_TYPES.other;
            const FileIcon = getFileIcon(doc.file_name);

            return (
              <div
                key={doc.id}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${typeConfig.color} flex-shrink-0`}>
                    <FileIcon className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-medium text-slate-900 truncate">{doc.title}</h4>
                        {doc.notes && (
                          <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{doc.notes}</p>
                        )}
                      </div>
                      <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 flex-wrap">
                      <span>{doc.file_name || 'N/A'}</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>•</span>
                      <span>{formatDate(doc.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isPreviewable(doc.file_name) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDoc(doc);
                          setShowPreviewModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}

                    <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                      <Download className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showUploadModal && (
        <UploadModal
          studentId={studentId}
          getHeaders={getHeaders}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            fetchDocuments();
          }}
        />
      )}

      {showPreviewModal && selectedDoc && (
        <PreviewModal
          document={selectedDoc}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedDoc(null);
          }}
        />
      )}
    </div>
  );
}

function UploadModal({ studentId, getHeaders, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'other',
    notes: '',
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File không được vượt quá 50MB');
      return;
    }

    setFile(selectedFile);
    setError('');

    if (!formData.title) {
      const fileNameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setFormData((prev) => ({ ...prev, title: fileNameWithoutExt }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Vui lòng nhập tên tài liệu');
      return;
    }

    if (!file) {
      setError('Vui lòng chọn file để tải lên');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const storagePath = `student-documents/${studentId}/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('document')
        .upload(storagePath, file);
      if (uploadError) throw new Error(uploadError.message);

      const { data: publicUrlData } = supabase.storage
        .from('document')
        .getPublicUrl(storagePath);

      const headers = getHeaders();
      const response = await fetch(`${API_URL}/api/students/${studentId}/documents`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          type: formData.type,
          file_url: publicUrlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
          notes: formData.notes.trim(),
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Không thể lưu tài liệu');
      }

      onSuccess();
    } catch (err) {
      console.error('Error uploading student document:', err);
      setError(err.message || 'Không thể tải lên tài liệu');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-slate-900">Thêm tài liệu học viên</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Chọn file</label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="student-document-file-upload"
              />
              <label htmlFor="student-document-file-upload" className="cursor-pointer">
                {file ? (
                  <div>
                    <p className="font-medium text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">Nhấn để chọn file tài liệu</p>
                    <p className="text-xs text-slate-400 mt-1">Tối đa 50MB</p>
                  </>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tên tài liệu <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Nhập tên tài liệu"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Loại tài liệu</label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại tài liệu" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOC_TYPES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Ghi chú</label>
            <textarea
              rows={3}
              placeholder="Nhập ghi chú nếu cần"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

          <div className="flex items-center gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={uploading}>
              Hủy
            </Button>
            <Button type="submit" className="flex-1" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tải lên...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Tải lên
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PreviewModal({ document, onClose }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(document.file_name || '');
  const isPdf = /\.pdf$/i.test(document.file_name || '');

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{document.title}</h3>
            <p className="text-sm text-slate-500 truncate">{document.file_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open(document.file_url, '_blank')}>
              <Download className="w-4 h-4 mr-2" />
              Tải xuống
            </Button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center">
          {isPdf ? (
            <iframe src={document.file_url} className="w-full h-full min-h-[70vh] bg-white" title={document.title} />
          ) : isImage ? (
            <div className="w-full h-full flex items-center justify-center p-4 bg-slate-800">
              <img src={document.file_url} alt={document.title} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <File className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500">Không hỗ trợ xem trước định dạng này</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDocumentsTab;
