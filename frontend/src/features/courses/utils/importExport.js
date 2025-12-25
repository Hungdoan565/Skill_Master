/**
 * Utility functions for importing and exporting course data as JSON
 */

export const exportCourseToJson = (courseData, filename = 'course-data.json') => {
    try {
        const dataStr = JSON.stringify(courseData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = filename;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        return { success: true };
    } catch (error) {
        console.error('Export failed:', error);
        return { success: false, error: 'Không thể xuất dữ liệu: ' + error.message };
    }
};

export const importCourseFromJson = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const jsonData = JSON.parse(event.target.result);

                // Basic validation of required fields
                if (!jsonData.title && !jsonData.code) {
                    reject(new Error('File JSON không hợp lệ hoặc thiếu thông tin bắt buộc.'));
                    return;
                }

                resolve({
                    success: true,
                    data: {
                        ...jsonData,
                        // Đảm bảo các field JSON là array
                        syllabus: Array.isArray(jsonData.syllabus) ? jsonData.syllabus : [],
                        outcomes: Array.isArray(jsonData.outcomes) ? jsonData.outcomes : [],
                        features: Array.isArray(jsonData.features) ? jsonData.features : [],
                        faq: Array.isArray(jsonData.faq) ? jsonData.faq : []
                    }
                });
            } catch (error) {
                reject(new Error('Lỗi khi đọc file JSON: ' + error.message));
            }
        };
        reader.onerror = () => reject(new Error('Lỗi khi tải file.'));
        reader.readAsText(file);
    });
};
