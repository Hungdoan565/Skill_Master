/**
 * ENROLLMENT SERVICE
 * Unified service functions for enrollment and invoice creation
 */

/**
 * Tạo enrollment và invoice draft
 * @param {Object} params - Enrollment parameters
 * @returns {Promise<Object>} { enrollment, invoice, error }
 */
export async function createEnrollmentWithDraftInvoice(supabase, params) {
    const {
        student_id,
        class_id,
        tuition_fee,
        discount_amount = 0,
        paid_amount = 0,
        notes = null,
        created_by = null
    } = params;

    try {
        // 1. Validate class exists
        const { data: classData, error: classError } = await supabase
            .from('classes')
            .select('id, name, code, max_students, center_id, courses(price)')
            .eq('id', class_id)
            .single();

        if (classError || !classData) {
            return {
                enrollment: null,
                invoice: null,
                error: 'Không tìm thấy lớp học'
            };
        }

        // 2. Check capacity
        const { count: currentCount } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', class_id)
            .eq('status', 'active');

        if (currentCount >= classData.max_students) {
            return {
                enrollment: null,
                invoice: null,
                error: `Lớp đã đầy (${currentCount}/${classData.max_students} học viên)`
            };
        }

        // 3. Check duplicate (active enrollment)
        const { data: existing } = await supabase
            .from('enrollments')
            .select('id, status')
            .eq('class_id', class_id)
            .eq('student_id', student_id)
            .single();

        if (existing && existing.status === 'active') {
            return {
                enrollment: null,
                invoice: null,
                error: 'Học viên đã có trong lớp này'
            };
        }

        // 4. If student was previously dropped, reactivate enrollment
        if (existing && existing.status === 'dropped') {
            const finalTuitionFee = tuition_fee ?? classData.courses?.price ?? 0;
            const finalDiscount = discount_amount ?? 0;

            const { data: reactivated, error: reactivateError } = await supabase
                .from('enrollments')
                .update({
                    status: 'active',
                    enrolled_at: new Date().toISOString(),
                    tuition_fee: finalTuitionFee,
                    discount_amount: finalDiscount,
                    paid_amount: paid_amount ?? 0,
                    notes
                })
                .eq('id', existing.id)
                .select()
                .single();

            if (reactivateError) {
                return { enrollment: null, invoice: null, error: reactivateError.message };
            }

            // Create draft invoice for reactivated enrollment
            const invoice = await createDraftInvoice(supabase, {
                student_id,
                enrollment_id: reactivated.id,
                class_id,
                class_name: classData.name,
                tuition_fee: finalTuitionFee,
                discount_amount: finalDiscount,
                paid_amount: paid_amount ?? 0,
                description: `Học phí lớp ${classData.name} (Ghi danh lại)`,
                created_by
            });

            return {
                enrollment: reactivated,
                invoice: invoice.data,
                error: null,
                message: 'Đã ghi danh lại học viên'
            };
        }

        // 5. Create new enrollment
        const finalTuitionFee = tuition_fee ?? classData.courses?.price ?? 0;
        const finalDiscount = discount_amount ?? 0;

        const { data: enrollment, error: enrollmentError } = await supabase
            .from('enrollments')
            .insert([{
                class_id,
                student_id,
                tuition_fee: finalTuitionFee,
                discount_amount: finalDiscount,
                paid_amount: paid_amount ?? 0,
                notes,
                status: 'active'
            }])
            .select()
            .single();

        if (enrollmentError) {
            return { enrollment: null, invoice: null, error: enrollmentError.message };
        }

        // 6. Create draft invoice
        const invoice = await createDraftInvoice(supabase, {
            student_id,
            enrollment_id: enrollment.id,
            class_id,
            class_name: classData.name,
            tuition_fee: finalTuitionFee,
            discount_amount: finalDiscount,
            paid_amount: paid_amount ?? 0,
            description: `Học phí lớp ${classData.name}`,
            created_by
        });

        return {
            enrollment,
            invoice: invoice.data,
            error: null,
            message: 'Ghi danh thành công'
        };
    } catch (error) {
        console.error('[createEnrollmentWithDraftInvoice] Error:', error);
        return {
            enrollment: null,
            invoice: null,
            error: error.message || 'Lỗi khi tạo enrollment'
        };
    }
}

/**
 * Tạo draft invoice cho enrollment
 * @param {Object} params - Invoice parameters
 * @returns {Promise<Object>} { data, error }
 */
export async function createDraftInvoice(supabase, params) {
    const {
        student_id,
        enrollment_id,
        class_id,
        class_name,
        tuition_fee,
        discount_amount = 0,
        paid_amount = 0,
        description,
        created_by = null
    } = params;

    try {
        const finalAmount = tuition_fee - discount_amount;
        const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days

        const { data, error } = await supabase
            .from('invoices')
            .insert([{
                student_id,
                enrollment_id,
                class_id,
                amount: tuition_fee,
                discount_amount,
                final_amount: finalAmount,
                paid_amount,
                status: 'draft', // 🔥 Luôn tạo ở trạng thái draft
                description: description || `Học phí lớp ${class_name}`,
                due_date: dueDate,
                created_by
            }])
            .select()
            .single();

        if (error) {
            console.warn('[createDraftInvoice] Error:', error.message);
            return { data: null, error: error.message };
        }

        console.log(`📄 Tạo hóa đơn draft ${data.invoice_number} cho enrollment ${enrollment_id}`);
        return { data, error: null };
    } catch (error) {
        console.error('[createDraftInvoice] Error:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Confirm draft invoice (chuyển từ draft -> unpaid/paid)
 * @param {UUID} invoiceId - ID của invoice
 * @returns {Promise<Object>} { data, error }
 */
export async function confirmInvoice(supabase, invoiceId, confirmedBy = null) {
    try {
        // Get invoice details
        const { data: invoice, error: fetchError } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', invoiceId)
            .single();

        if (fetchError || !invoice) {
            return { data: null, error: 'Không tìm thấy hóa đơn' };
        }

        if (invoice.status !== 'draft') {
            return { data: null, error: 'Chỉ có thể confirm hóa đơn ở trạng thái draft' };
        }

        // Determine new status based on payment
        const finalAmount = invoice.final_amount || (invoice.amount - invoice.discount_amount);
        let newStatus = 'unpaid';
        if (invoice.paid_amount >= finalAmount) {
            newStatus = 'paid';
        } else if (invoice.paid_amount > 0) {
            newStatus = 'partial';
        }

        // Update status
        const { data, error } = await supabase
            .from('invoices')
            .update({
                status: newStatus,
                confirmed_by: confirmedBy,
                confirmed_at: new Date().toISOString()
            })
            .eq('id', invoiceId)
            .select()
            .single();

        if (error) {
            return { data: null, error: error.message };
        }

        console.log(`✅ Confirmed invoice ${invoice.invoice_number}: draft -> ${newStatus}`);
        return { data, error: null };
    } catch (error) {
        console.error('[confirmInvoice] Error:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Void/Cancel draft invoice
 * @param {UUID} invoiceId - ID của invoice
 * @returns {Promise<Object>} { data, error }
 */
export async function voidDraftInvoice(supabase, invoiceId) {
    try {
        const { data: invoice, error: fetchError } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', invoiceId)
            .single();

        if (fetchError || !invoice) {
            return { data: null, error: 'Không tìm thấy hóa đơn' };
        }

        if (invoice.status !== 'draft') {
            return { data: null, error: 'Chỉ có thể void hóa đơn ở trạng thái draft' };
        }

        const { data, error } = await supabase
            .from('invoices')
            .update({ status: 'cancelled' })
            .eq('id', invoiceId)
            .select()
            .single();

        if (error) {
            return { data: null, error: error.message };
        }

        console.log(`🗑️ Voided draft invoice ${invoice.invoice_number}`);
        return { data, error: null };
    } catch (error) {
        console.error('[voidDraftInvoice] Error:', error);
        return { data: null, error: error.message };
    }
}
