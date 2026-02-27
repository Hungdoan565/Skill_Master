import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { formatCertificateDate, formatCertificateDateVN, getGradeInfo } from '../../utils/pdf-utils';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFDF9',
    fontFamily: 'Lora',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 50,
  },
  watermark: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    width: '80%',
    textAlign: 'center',
    fontSize: 70,
    color: '#F59E0B',
    opacity: 0.03,
    transform: 'rotate(-15deg)',
    zIndex: -1,
    fontFamily: 'Lora',
    fontWeight: 700,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: '#F59E0B',
  },
  bottomAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: '#F59E0B',
  },
  logoContainer: {
    marginBottom: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logo: {
    height: 60,
    objectFit: 'contain',
    marginBottom: 10,
  },
  centerName: {
    fontSize: 18,
    fontWeight: 600,
    color: '#78350F',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 700,
    color: '#92400E',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#B45309',
    fontStyle: 'italic',
    marginTop: 5,
  },
  studentSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginVertical: 30,
    width: '80%',
  },
  presentedTo: {
    fontSize: 14,
    color: '#78350F',
    marginBottom: 15,
  },
  studentName: {
    fontFamily: 'Satisfy',
    fontSize: 54,
    color: '#451A03',
    borderBottom: '1pt solid #F59E0B',
    width: '100%',
    textAlign: 'center',
    paddingBottom: 5,
  },
  courseSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
  },
  forCompleting: {
    fontSize: 14,
    color: '#78350F',
    marginBottom: 10,
  },
  courseName: {
    fontSize: 26,
    fontWeight: 700,
    color: '#92400E',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  detailsRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 50,
    marginVertical: 15,
    paddingVertical: 10,
    borderTop: '1pt solid #FEF3C7',
    borderBottom: '1pt solid #FEF3C7',
    width: '80%',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 600,
    color: '#78350F',
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 'auto',
    alignItems: 'flex-end',
  },
  signatureContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 40,
  },
  signatureBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: 150,
  },
  signatureLine: {
    width: 130,
    borderBottom: '1pt solid #78350F',
    marginBottom: 8,
    height: 30,
  },
  signatureName: {
    fontSize: 12,
    fontWeight: 600,
    color: '#451A03',
  },
  signatureTitle: {
    fontSize: 10,
    color: '#92400E',
    fontStyle: 'italic',
    marginTop: 2,
  },
  qrContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  qrCode: {
    width: 70,
    height: 70,
  },
  serialNumber: {
    fontSize: 9,
    color: '#B45309',
    marginTop: 4,
  },
});

export const ElegantWarmTemplate = ({ certificate, certificateType, centerInfo, options, qrDataUrl }) => {
  const { student_name, grade, scores, completion_date, certificate_number } = certificate;
  const scoreConfig = certificateType?.score_config || { type: 'none' };
  
  const gradeInfo = grade ? getGradeInfo(grade) : null;

  return (
    <Document>
      <Page size={[842, 595]} style={styles.page}>
        <View style={styles.topAccent} />
        <View style={styles.bottomAccent} />
        
        <Text style={styles.watermark}>{centerInfo?.name || 'CERTIFIED'}</Text>

        <View style={styles.logoContainer}>
          {centerInfo?.logo_url && (
            <Image src={centerInfo.logo_url} style={styles.logo} />
          )}
          <Text style={styles.centerName}>{centerInfo?.name || 'TRAINING ACADEMY'}</Text>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>CERTIFICATE</Text>
          <Text style={styles.subtitle}>of Outstanding Achievement</Text>
        </View>

        <View style={styles.studentSection}>
          <Text style={styles.presentedTo}>This is proudly presented to</Text>
          <Text style={styles.studentName}>{student_name}</Text>
        </View>

        <View style={styles.courseSection}>
          <Text style={styles.forCompleting}>for successfully completing the course</Text>
          <Text style={styles.courseName}>{certificateType?.name || certificate.course_name}</Text>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Awarded On</Text>
            <Text style={styles.detailValue}>{formatCertificateDate(completion_date)}</Text>
          </View>

          {gradeInfo && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Performance</Text>
              <Text style={styles.detailValue}>{gradeInfo.en}</Text>
            </View>
          )}

          {scoreConfig.type === 'numeric' && scores && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Score</Text>
              <Text style={styles.detailValue}>
                {scores.overall || '-'}{scoreConfig.max_score ? ` / ${scoreConfig.max_score}` : ''}
              </Text>
            </View>
          )}

          {scoreConfig.type === 'band' && scores && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Band Score</Text>
              <Text style={styles.detailValue}>{scores.overall || '-'}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.signatureContainer}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>Lead Trainer</Text>
              <Text style={styles.signatureTitle}>Giảng viên Chính</Text>
            </View>

            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>Center Director</Text>
              <Text style={styles.signatureTitle}>Giám đốc Trung tâm</Text>
            </View>

          </View>

          <View style={styles.qrContainer}>
            {options?.showQR !== false && qrDataUrl && (
              <Image src={qrDataUrl} style={styles.qrCode} />
            )}
            {options?.showSerial !== false && (
              <Text style={styles.serialNumber}>ID: {certificate_number}</Text>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
};
