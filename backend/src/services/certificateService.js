/**
 * CERTIFICATE SERVICE
 * Service functions for certificate eligibility checking and issuance
 */

/**
 * Kiểm tra điều kiện cấp chứng chỉ cho học viên
 * @param {Object} supabase - Supabase client
 * @param {UUID} studentId - ID học viên
 * @param {UUID} classId - ID lớp học
 * @param {UUID} certificateTypeId - ID loại chứng chỉ
 * @returns {Promise<Object>} Eligibility result
 */
export async function checkCertificateEligibility(supabase, studentId, classId, certificateTypeId) {
    try {
        // Call database function
        const { data, error } = await supabase
            .rpc('check_certificate_eligibility', {
                p_student_id: studentId,
                p_class_id: classId,
                p_certificate_type_id: certificateTypeId
            })
            .single();

        if (error) {
            console.error('[checkCertificateEligibility] RPC Error:', error);
            return {
                eligible: false,
                attendance_rate: null,
                average_grade: null,
                min_attendance_required: null,
                min_grade_required: null,
                reasons: ['Lỗi khi kiểm tra điều kiện: ' + error.message],
                error: error.message
            };
        }

        return {
            eligible: data.eligible,
            attendance_rate: data.attendance_rate,
            average_grade: data.average_grade,
            min_attendance_required: data.min_attendance_required,
            min_grade_required: data.min_grade_required,
            reasons: data.reasons || [],
            error: null
        };
    } catch (error) {
        console.error('[checkCertificateEligibility] Error:', error);
        return {
            eligible: false,
            attendance_rate: null,
            average_grade: null,
            min_attendance_required: null,
            min_grade_required: null,
            reasons: ['Lỗi hệ thống: ' + error.message],
            error: error.message
        };
    }
}

/**
 * Issue certificate với override reason nếu không đủ điều kiện
 * @param {Object} params - Certificate issuance parameters
 * @returns {Promise<Object>} { data, error }
 */
export async function issueCertificate(supabase, params) {
    const {
        student_id,
        class_id,
        certificate_type_id,
        issue_date,
        override_reason = null,
        issued_by = null
    } = params;

    try {
        // 1. Check eligibility first
        const eligibility = await checkCertificateEligibility(
            supabase,
            student_id,
            class_id,
            certificate_type_id
        );

        // 2. If not eligible and no override reason, reject
        if (!eligibility.eligible && !override_reason) {
            return {
                data: null,
                error: 'Học viên chưa đủ điều kiện cấp chứng chỉ',
                eligibility,
                requiresOverride: true
            };
        }

        // 3. Check if certificate already exists
        const { data: existing } = await supabase
            .from('certificates')
            .select('id, certificate_code, status')
            .eq('student_id', student_id)
            .eq('class_id', class_id)
            .eq('certificate_type_id', certificate_type_id)
            .single();

        if (existing) {
            return {
                data: null,
                error: `Chứng chỉ đã được cấp (${existing.certificate_code})`,
                eligibility: null,
                requiresOverride: false
            };
        }

        // 4. Get certificate type details
        const { data: certType } = await supabase
            .from('certificate_types')
            .select('name, template_url')
            .eq('id', certificate_type_id)
            .single();

        // 5. Get class details
        const { data: classData } = await supabase
            .from('classes')
            .select('name, center_id')
            .eq('id', class_id)
            .single();

        // 6. Create certificate
        const { data: certificate, error: insertError } = await supabase
            .from('certificates')
            .insert([{
                student_id,
                class_id,
                certificate_type_id,
                issue_date: issue_date || new Date().toISOString().split('T')[0],
                status: 'active',
                template_url: certType?.template_url,
                metadata: {
                    attendance_rate: eligibility.attendance_rate,
                    average_grade: eligibility.average_grade,
                    override_reason: override_reason || null,
                    issued_by
                }
            }])
            .select(`
        *,
        student:profiles!certificates_student_id_fkey(id, full_name, email),
        class:classes(id, name, code),
        certificate_type:certificate_types(id, name, code)
      `)
            .single();

        if (insertError) {
            return {
                data: null,
                error: insertError.message,
                eligibility: null,
                requiresOverride: false
            };
        }

        // 7. Log override if used
        if (!eligibility.eligible && override_reason) {
            console.log(`⚠️ Certificate ${certificate.certificate_code} issued WITH OVERRIDE:`);
            console.log(`   Student: ${student_id}, Reason: ${override_reason}`);
            console.log(`   Eligibility: ${JSON.stringify(eligibility)}`);
        } else {
            console.log(`✅ Certificate ${certificate.certificate_code} issued (eligible)`);
        }

        return {
            data: certificate,
            error: null,
            eligibility,
            requiresOverride: false
        };
    } catch (error) {
        console.error('[issueCertificate] Error:', error);
        return {
            data: null,
            error: error.message || 'Lỗi khi cấp chứng chỉ',
            eligibility: null,
            requiresOverride: false
        };
    }
}

/**
 * Get students eligible for certificates in a class
 * @param {UUID} classId - ID của lớp học
 * @param {UUID} certificateTypeId - ID loại chứng chỉ (optional)
 * @returns {Promise<Object>} List of eligible students with details
 */
export async function getEligibleStudentsForCertificates(supabase, classId, certificateTypeId = null) {
    try {
        // Get all enrollments in class
        const { data: enrollments, error: enrollError } = await supabase
            .from('enrollments')
            .select(`
        student_id,
        student:profiles!enrollments_student_id_fkey(id, full_name, email)
      `)
            .eq('class_id', classId)
            .eq('status', 'active');

        if (enrollError) {
            return { data: [], error: enrollError.message };
        }

        // Get certificate types for the class's course
        let certTypes = [];
        if (certificateTypeId) {
            const { data } = await supabase
                .from('certificate_types')
                .select('id, name, code')
                .eq('id', certificateTypeId)
                .single();
            certTypes = data ? [data] : [];
        } else {
            const { data: classData } = await supabase
                .from('classes')
                .select('course_id')
                .eq('id', classId)
                .single();

            if (classData) {
                const { data } = await supabase
                    .from('certificate_types')
                    .select('id, name, code')
                    .eq('course_id', classData.course_id);
                certTypes = data || [];
            }
        }

        // Check eligibility for each student and cert type
        const results = [];
        for (const enrollment of enrollments) {
            for (const certType of certTypes) {
                const eligibility = await checkCertificateEligibility(
                    supabase,
                    enrollment.student_id,
                    classId,
                    certType.id
                );

                if (eligibility.eligible) {
                    results.push({
                        student_id: enrollment.student_id,
                        student_name: enrollment.student?.full_name,
                        certificate_type_id: certType.id,
                        certificate_type_name: certType.name,
                        attendance_rate: eligibility.attendance_rate,
                        average_grade: eligibility.average_grade
                    });
                }
            }
        }

        return { data: results, error: null };
    } catch (error) {
        console.error('[getEligibleStudentsForCertificates] Error:', error);
        return { data: [], error: error.message };
    }
}
