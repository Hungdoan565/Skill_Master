import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const backendSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', 'src', 'index.js'),
    'utf8',
);

const chartLabelsSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'reports', 'utils', 'chart-labels.js'),
    'utf8',
);

test('attendance report backend returns readable Vietnamese byStatus labels', () => {
    assert.match(backendSource, /name: 'Có mặt'/);
    assert.match(backendSource, /name: 'Vắng'/);
    assert.match(backendSource, /name: 'Trễ'/);
    assert.match(backendSource, /name: 'Có phép'/);
    assert.doesNotMatch(backendSource, /CÃƒÂ³ mÃ¡ÂºÂ·t/);
    assert.doesNotMatch(backendSource, /VÃ¡ÂºÂ¯ng/);
    assert.doesNotMatch(backendSource, /TrÃ¡Â»â€¦/);
    assert.doesNotMatch(backendSource, /CÃƒÂ³ phÃƒÂ©p/);
});

test('grades report backend returns readable Vietnamese pass-rate labels', () => {
    assert.match(backendSource, /name: 'Đạt', value: passedStudents/);
    assert.match(backendSource, /name: 'Không đạt', value: failedStudents/);
    assert.doesNotMatch(backendSource, /Ã„ÂÃ¡ÂºÂ¡t/);
    assert.doesNotMatch(backendSource, /KhÃƒÂ´ng Ã„â€˜Ã¡ÂºÂ¡t/);
});

test('report chart label utility repairs mojibake variants used by attendance and grades reports', () => {
    assert.match(chartLabelsSource, /'CÃƒÂ³ mÃ¡ÂºÂ·t': 'Có mặt'/);
    assert.match(chartLabelsSource, /'CÃƒÂ³ phÃƒÂ©p': 'Có phép'/);
    assert.match(chartLabelsSource, /'TrÃ¡Â»â€¦': 'Trễ'/);
    assert.match(chartLabelsSource, /'VÃ¡ÂºÂ¯ng': 'Vắng'/);
    assert.match(chartLabelsSource, /'Äáº¡t': 'Đạt'/);
    assert.match(chartLabelsSource, /'KhÃ´ng Äáº¡t': 'Không đạt'/);
});
