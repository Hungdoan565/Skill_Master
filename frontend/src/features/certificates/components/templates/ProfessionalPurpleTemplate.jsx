import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { formatCertificateDate, formatCertificateDateVN, getGradeInfo } from '../../utils/pdf-utils';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FAFAFA',
    fontFamily: 'Inter',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  watermark: {
    position: 'absolute',
    top: '35%',
    left: '5%',
    width: '90%',
    textAlign: 'center',
    fontSize: 70,
    color: '#8B5CF6',
    opacity: 0.03,
    transform: 'rotate(-20deg)',
    zIndex: -1,
    fontFamily: 'JetBrains Mono',
    fontWeight: 700,
  },
  header: {
    height: 120,
    backgroundColor: '#6D28D9',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 50,
    borderBottom: '4pt solid #8B5CF6',
  },
  logo: {
    height: 60,
    marginRight: 20,
    objectFit: 'contain',
  },
  headerTextContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  centerName: {
    color: '#F5F3FF',
    fontSize: 24,
    fontWeight: 700,
    fontFamily: 'Inter',
    letterSpacing: 1,
  },
  tagline: {
    color: '#A78BFA',
    fontSize: 12,
    fontFamily: 'JetBrains Mono',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: '40 50',
    display: 'flex',
    flexDirection: 'column',
  },
  titleWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  bracket: {
    fontFamily: 'JetBrains Mono',
    fontSize: 48,
    color: '#8B5CF6',
    fontWeight: 700,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 40,
    fontWeight: 700,
    color: '#1E1B4B',
    marginHorizontal: 15,
    letterSpacing: 3,
  },
  certifiesThat: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 10,
    fontFamily: 'JetBrains Mono',
  },
  studentName: {
    fontFamily: 'JetBrains Mono',
    fontSize: 36,
    fontWeight: 700,
    color: '#4C1D95',
    marginBottom: 20,
    borderBottom: '2pt solid #E11D48',
    paddingBottom: 5,
    alignSelf: 'flex-start',
  },
  completedText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 10,
  },
  courseName: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 30,
  },
  grid: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F5F3FF',
    padding: 20,
    borderRadius: 8,
    borderLeft: '4pt solid #8B5CF6',
    marginBottom: 40,
  },
  gridCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  gridLabel: {
    fontFamily: 'JetBrains Mono',
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  gridValue: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 700,
    color: '#1F2937',
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 'auto',
  },
  signatureContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 40,
  },
  signatureBlock: {
    display: 'flex',
    flexDirection: 'column',
    width: 160,
  },
  signatureLine: {
    borderBottom: '1pt solid #4C1D95',
    marginBottom: 8,
    height: 40,
  },
  signatureName: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 700,
    color: '#1E1B4B',
  },
  signatureTitle: {
    fontFamily: 'JetBrains Mono',
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },
  qrSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  qrCode: {
    width: 75,
    height: 75,
    border: '2pt solid #E5E7EB',
    padding: 2,
    borderRadius: 4,
  },
  serialNumber: {
    fontFamily: 'JetBrains Mono',
    fontSize: 8,
    color: '#9CA3AF',
    marginTop: 5,
  },
});

export const ProfessionalPurpleTemplate = ({ certificate, certificateType, centerInfo, options, qrDataUrl }) => {
  const { student_name, grade, scores, completion_date, certificate_number } = certificate;
  const scoreConfig = certificateType?.score_config || { type: 'none' };
  
  const gradeInfo = grade ? getGradeInfo(grade) : null;

  return (
    <Document>
      <Page size={[842, 595]} style={styles.page}>
        <View style={styles.header}>
          {centerInfo?.logo_url && (
            <Image src={centerInfo.logo_url} style={styles.logo} />
          )}
          <View style={styles.headerTextContainer}>
            <Text style={styles.centerName}>{centerInfo?.name || 'TECHNOLOGY INSTITUTE'}</Text>
            <Text style={styles.tagline}>// EMPOWERING THE FUTURE OF TECH</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.watermark}>{centerInfo?.name || 'CERTIFIED'}</Text>

          <View style={styles.titleWrapper}>
            <Text style={styles.bracket}>{'{'}</Text>
            <Text style={styles.title}>CERTIFICATE</Text>
            <Text style={styles.bracket}>{'}'}</Text>
          </View>
          <Text style={styles.certifiesThat}>This is to certify that</Text>

          <Text style={styles.studentName}>{student_name}</Text>

          <Text style={styles.completedText}>has successfully completed the requirements for</Text>
          
          <Text style={styles.courseName}>{certificateType?.name || certificate.course_name}</Text>

          <View style={styles.grid}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Date of Issue</Text>
              <Text style={styles.gridValue}>{formatCertificateDate(completion_date)}</Text>
            </View>

            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Certificate ID</Text>
              <Text style={styles.gridValue}>{certificate_number}</Text>
            </View>

            {gradeInfo && (
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Result Grade</Text>
                <Text style={{ ...styles.gridValue, color: '#8B5CF6' }}>{gradeInfo.en}</Text>
              </View>
            )}

            {scoreConfig.type === 'numeric' && scores && (
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Final Score</Text>
                <Text style={{ ...styles.gridValue, color: '#8B5CF6' }}>
                  {scores.overall || '-'}{scoreConfig.max_score ? ` / ${scoreConfig.max_score}` : ''}
                </Text>
              </View>
            )}

            {scoreConfig.type === 'band' && scores && scoreConfig.sub_scores && (
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Overall Band</Text>
                <Text style={{ ...styles.gridValue, color: '#8B5CF6' }}>{scores.overall || '-'}</Text>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <View style={styles.signatureContainer}>
              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureName}>Lead Instructor</Text>
                <Text style={styles.signatureTitle}>Giảng viên Chính</Text>
              </View>

              <View style={styles.signatureBlock}>
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
                <Text style={styles.serialNumber}>ID: {certificate_number}</Text>
              )}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
