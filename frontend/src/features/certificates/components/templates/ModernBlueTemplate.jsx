import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { formatCertificateDate, formatCertificateDateVN, getGradeInfo } from '../../utils/pdf-utils';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    fontFamily: 'Inter',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  watermark: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    width: '80%',
    textAlign: 'center',
    fontSize: 60,
    color: '#3B82F6',
    opacity: 0.04,
    transform: 'rotate(-30deg)',
    zIndex: -1,
    fontFamily: 'Poppins',
    fontWeight: 700,
  },
  topBar: {
    height: 80,
    backgroundColor: '#1E40AF',
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    justifyContent: 'space-between',
  },
  bottomBar: {
    height: 30,
    backgroundColor: '#1E40AF',
    width: '100%',
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: 1,
    fontFamily: 'Poppins',
  },
  content: {
    flex: 1,
    padding: 40,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  badgeContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    border: '2pt solid #3B82F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 24,
    color: '#3B82F6',
    fontWeight: 700,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 36,
    fontWeight: 700,
    color: '#1E3A8A',
    letterSpacing: 2,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 30,
  },
  studentName: {
    fontFamily: 'Poppins',
    fontSize: 42,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 15,
  },
  courseName: {
    fontSize: 24,
    fontWeight: 600,
    color: '#2563EB',
    marginBottom: 25,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  statsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 20,
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#F8FAFC',
    border: '1pt solid #E2E8F0',
    borderRadius: 8,
    padding: 15,
    minWidth: 120,
    display: 'flex',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 5,
    fontWeight: 600,
  },
  statValue: {
    fontSize: 18,
    color: '#0F172A',
    fontWeight: 700,
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 'auto',
    alignItems: 'flex-end',
  },
  signaturesContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 50,
  },
  signatureSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: 200,
  },
  signatureLine: {
    width: 150,
    borderBottom: '1pt solid #94A3B8',
    marginBottom: 8,
  },
  signatureName: {
    fontSize: 12,
    fontWeight: 700,
    color: '#1E293B',
    marginBottom: 2,
  },
  signatureTitle: {
    fontSize: 10,
    color: '#64748B',
  },
  qrSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  qrCode: {
    width: 80,
    height: 80,
  },
  serialText: {
    fontSize: 8,
    color: '#94A3B8',
    marginTop: 5,
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginTop: 20,
    width: '100%',
    paddingVertical: 15,
    borderTop: '1pt solid #E2E8F0',
    borderBottom: '1pt solid #E2E8F0',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
});

export const ModernBlueTemplate = ({ certificate, certificateType, centerInfo, options, qrDataUrl }) => {
  const { student_name, grade, scores, completion_date, certificate_number } = certificate;
  const scoreConfig = certificateType?.score_config || { type: 'none' };
  
  const gradeInfo = grade ? getGradeInfo(grade) : null;

  return (
    <Document>
      <Page size={[842, 595]} style={styles.page}>
        <View style={styles.topBar}>
          <Text style={styles.headerText}>{centerInfo?.name || 'TRAINING CENTER'}</Text>
          <Text style={{ ...styles.headerText, fontSize: 14, fontWeight: 400 }}>Official Certification</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.watermark}>{centerInfo?.name || 'CERTIFIED'}</Text>

          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>★</Text>
          </View>

          <Text style={styles.title}>CERTIFICATE OF ACHIEVEMENT</Text>
          <Text style={styles.subtitle}>This is to certify that</Text>

          <Text style={styles.studentName}>{student_name}</Text>

          <Text style={styles.subtitle}>has successfully completed</Text>
          
          <Text style={styles.courseName}>{certificateType?.name || certificate.course_name}</Text>

          <View style={styles.statsContainer}>
            {gradeInfo && (
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Result Grade</Text>
                <Text style={styles.statValue}>{gradeInfo.en}</Text>
              </View>
            )}

            {scoreConfig.type === 'numeric' && scores && (
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Final Score</Text>
                <Text style={styles.statValue}>
                  {scores.overall || '-'}{scoreConfig.max_score ? ` / ${scoreConfig.max_score}` : ''}
                </Text>
              </View>
            )}

            {scoreConfig.type === 'band' && scores && scoreConfig.sub_scores && (
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Overall Band</Text>
                <Text style={styles.statValue}>{scores.overall || '-'}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.statLabel}>Date of Issue</Text>
              <Text style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>
                {formatCertificateDate(completion_date)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.statLabel}>Certificate ID</Text>
              <Text style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>
                {certificate_number}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.signaturesContainer}>
              <View style={styles.signatureSection}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureName}>Program Manager</Text>
                <Text style={styles.signatureTitle}>Quản lý Chương trình</Text>
              </View>

              <View style={styles.signatureSection}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureName}>Center Director</Text>
                <Text style={styles.signatureTitle}>Giám đốc Trung tâm</Text>
              </View>
            </View>
            <View style={styles.qrSection}>
              {options?.showQR !== false && qrDataUrl && (
                <Image src={qrDataUrl} style={styles.qrCode} />
              )}
              {options?.showSerial !== false && (
                <Text style={styles.serialText}>VERIFY: {certificate_number}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.bottomBar} />
      </Page>
    </Document>
  );
};
