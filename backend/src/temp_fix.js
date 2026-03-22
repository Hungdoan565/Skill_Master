const fs = require('fs');
const file = 'backend/src/index.js';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
console.log('Replacing line 25337: ', lines[25336]);
lines[25336] = '      message: `Đã ghi danh ${allEnrolled.length} học viên và tạo ${invoiceResults.length} hóa đơn nháp`';
fs.writeFileSync(file, lines.join('\n'));
console.log('Done replacing line 25337');
