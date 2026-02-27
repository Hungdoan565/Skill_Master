import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { formatCertificateDate, formatCertificateDateVN, getGradeInfo } from '../../utils/pdf-utils';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FCFAF5',
    padding: 40,
    fontFamily: 'Cormorant Garamond',
    position: 'relative',
  },
  borderContainer: {
    flex: 1,
    border: '3pt solid #D4AF37',
    padding: 10,
  },
  innerBorder: {
    flex: 1,
    border: '1pt solid #D4AF37',
    padding: 30,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  watermark: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    width: '80%',
    textAlign: 'center',
    fontSize: 80,
    color: '#D4AF37',
    opacity: 0.04,
    transform: 'rotate(-30deg)',
    zIndex: -1,
    fontFamily: 'Cormorant Garamond',
    fontWeight: 700,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  logo: {
    height: 60,
    objectFit: 'contain',
    marginBottom: 10,
  },
  centerName: {
    fontSize: 24,
    fontWeight: 700,
    color: '#333333',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  presentsText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#555555',
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginVertical: 15,
  },
  mainTitle: {
    fontSize: 48,
    fontWeight: 700,
    color: '#D4AF37',
    letterSpacing: 8,
    textTransform: 'uppercase',
  },
  subTitle: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#555555',
    letterSpacing: 2,
  },
  studentNameContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '1pt solid #D4AF37',
    paddingBottom: 5,
    minWidth: 400,
    marginVertical: 10,
  },
  studentName: {
    fontFamily: 'Great Vibes',
    fontSize: 54,
    color: '#111111',
  },
  completionText: {
    fontSize: 16,
    color: '#555555',
    marginBottom: 10,
  },
  courseName: {
    fontSize: 26,
    fontWeight: 700,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 15,
    paddingHorizontal: 40,
  },
  gradeScoreContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    marginVertical: 10,
  },
  gradeBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  gradeLabel: {
    fontSize: 12,
    color: '#777777',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  gradeValue: {
    fontSize: 24,
    fontWeight: 700,
    color: '#D4AF37',
    marginTop: 2,
  },
  scoreRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 15,
  },
  scoreItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#F9F6F0',
    padding: '6 12',
    border: '0.5pt solid #E8D399',
    borderRadius: 4,
  },
  scoreLabel: {
    fontSize: 10,
    color: '#666666',
    textTransform: 'uppercase',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 700,
    color: '#333333',
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 'auto',
  },
  signatureBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: 200,
  },
  signatureLine: {
    width: 150,
    borderBottom: '1pt solid #333333',
    marginBottom: 8,
  },
  signatureTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#333333',
    textTransform: 'uppercase',
  },
  signatureSubtitle: {
    fontSize: 10,
    color: '#777777',
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
    color: '#777777',
    marginTop: 4,
    fontFamily: 'Cormorant Garamond',
  },
  dateContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateText: {
    fontSize: 12,
    color: '#555555',
  },
});

export const ClassicGoldTemplate = ({ certificate, certificateType, centerInfo, options, qrDataUrl }) => {
  const { student_name, grade, scores, completion_date, certificate_number } = certificate;
  const scoreConfig = certificateType?.score_config || { type: 'none' };
  
  const renderScores = () => {
    if (scoreConfig.type === 'none' || !scores) return null;
    
    if (scoreConfig.type === 'band' && scoreConfig.sub_scores) {
      return (
        <View style={styles.scoreRow}>
          {scoreConfig.sub_scores.map(sub => (
            <View key={sub.code} style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>{sub.name}</Text>
              <Text style={styles.scoreValue}>{scores[sub.code] || '-'}</Text>
            </View>
          ))}
          <View style={{ ...styles.scoreItem, backgroundColor: '#E8D399' }}>
            <Text style={{ ...styles.scoreLabel, color: '#333333' }}>Overall</Text>
            <Text style={styles.scoreValue}>{scores.overall || '-'}</Text>
          </View>
        </View>
      );
    }
    
    if (scoreConfig.type === 'numeric') {
      return (
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreValue}>
            {scores.overall || '-'}{scoreConfig.max_score ? ` / ${scoreConfig.max_score}` : ''}
          </Text>
        </View>
      );
    }
    
    return null;
  };

  const gradeInfo = grade ? getGradeInfo(grade) : null;

  return (
    <Document>
      <Page size={[842, 595]} style={styles.page}>
        <View style={styles.borderContainer}>
          <View style={styles.innerBorder}>
            
            <Text style={styles.watermark}>{centerInfo?.name || 'CERTIFICATE'}</Text>
            
            <View style={styles.header}>
              {centerInfo?.logo_url && (
                <Image src={centerInfo.logo_url} style={styles.logo} />
              )}
              <Text style={styles.centerName}>{centerInfo?.name || 'TRAINING CENTER'}</Text>
              <Text style={styles.presentsText}>proudly presents this</Text>
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.mainTitle}>Certificate</Text>
              <Text style={styles.subTitle}>of Completion</Text>
            </View>

            <View style={styles.studentNameContainer}>
              <Text style={styles.studentName}>{student_name}</Text>
            </View>

            <Text style={styles.completionText}>has successfully completed the requirements for</Text>
            
            <Text style={styles.courseName}>{certificateType?.name || certificate.course_name}</Text>

            <View style={styles.gradeScoreContainer}>
              {gradeInfo && (
                <View style={styles.gradeBox}>
                  <Text style={styles.gradeLabel}>Grade</Text>
                  <Text style={styles.gradeValue}>{gradeInfo.vi} / {gradeInfo.en}</Text>
                </View>
              )}
              
              {renderScores()}
            </View>

            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>{formatCertificateDateVN(completion_date)}</Text>
              <Text style={styles.dateText}>({formatCertificateDate(completion_date)})</Text>
            </View>

            <View style={styles.footer}>
              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureTitle}>Center Director</Text>
                <Text style={styles.signatureSubtitle}>Giám đốc Trung tâm</Text>
              </View>

              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureTitle}>Academic Director</Text>
                <Text style={styles.signatureSubtitle}>Giám đốc Học thuật</Text>
              </View>

              <View style={styles.qrContainer}>
                {options?.showQR !== false && qrDataUrl && (
                  <Image src={qrDataUrl} style={styles.qrCode} />
                )}
                {options?.showSerial !== false && (
                  <Text style={styles.serialNumber}>No. {certificate_number}</Text>
                )}
              </View>
            </View>

          </View>
        </View>
      </Page>
    </Document>
  );
};
