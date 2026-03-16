import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').filter(Boolean)

function getCorsHeaders(req: Request) {
    const origin = req.headers.get('origin') || ''
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const isAllowed = ALLOWED_ORIGINS.includes(origin)
        || (supabaseUrl && origin.includes(new URL(supabaseUrl).hostname))
        || origin.includes('localhost')
        || origin.includes('127.0.0.1')
    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : '',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }
}

serve(async (req) => {
    const corsHeaders = getCorsHeaders(req)

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const reqData = await req.json()
        const {
            name, phone, email,
            goal, level, callTime,
            timeSlot, course,
            source, source_page, utm_params,
            center_id, centerId,
            user_id, session_id
        } = reqData

        // Basic Validation
        if (!name || !phone) {
            throw new Error('Họ tên và số điện thoại là bắt buộc')
        }

        const normalizedPhone = String(phone).replace(/[\s.-]/g, '')

        // Validate Vietnamese phone number format (10 digits starting with 0, or +84 format)
        const phoneRegex = /^(0[3-9]\d{8}|\+84[3-9]\d{8})$/
        if (!phoneRegex.test(normalizedPhone)) {
            throw new Error('Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)')
        }

        const preferredTimeMap: Record<string, string> = {
            morning: 'Sáng',
            afternoon: 'Chiều',
            evening: 'Tối',
            anytime: 'Bất kỳ lúc nào'
        }
        const preferredTimeKey = timeSlot || callTime || null
        const preferredTime = preferredTimeKey ? (preferredTimeMap[preferredTimeKey] || preferredTimeKey) : null
        const resolvedCenterId = center_id || centerId || null
        const metadata = {
            goal: goal || null,
            level: level || null,
            course: course || null,
            message: reqData.message || null,
            utm_params: utm_params || {},
            submitted_at: reqData.submitted_at || null,
            legacy_source: 'consultation-api'
        }
        const baseNotes = [
            reqData.message ? `Nội dung: ${reqData.message}` : null,
            goal ? `Mục tiêu: ${goal}` : null,
            level ? `Trình độ: ${level}` : null,
            course ? `Khóa học quan tâm: ${course}` : null
        ].filter(Boolean).join('\n')

        let existingQuery = supabaseClient
            .from('consultation_requests')
            .select('id, notes, metadata')
            .eq('phone', normalizedPhone)
            .in('status', ['new', 'contacted', 'scheduled'])
            .limit(1)

        existingQuery = resolvedCenterId
            ? existingQuery.eq('center_id', resolvedCenterId)
            : existingQuery.is('center_id', null)

        const { data: existingRows, error: existingError } = await existingQuery

        if (existingError) {
            console.error('Consultation duplicate check error:', existingError)
            throw existingError
        }

        const existing = existingRows?.[0]

        let data
        let error

        if (existing) {
            const updatePayload = {
                full_name: name,
                email: email || null,
                preferred_time: preferredTime,
                source: source || 'website',
                source_page: source_page || 'unknown',
                center_id: resolvedCenterId,
                user_id: user_id || null,
                session_id: session_id || null,
                metadata: { ...(existing.metadata || {}), ...metadata },
                notes: [existing.notes || '', baseNotes].filter(Boolean).join('\n\n').trim() || null,
                utm_source: utm_params?.utm_source || null,
                utm_campaign: utm_params?.utm_campaign || null,
                updated_at: new Date().toISOString()
            }

            const response = await supabaseClient
                .from('consultation_requests')
                .update(updatePayload)
                .eq('id', existing.id)
                .select()

            data = response.data
            error = response.error
        } else {
            const response = await supabaseClient
                .from('consultation_requests')
                .insert({
                    full_name: name,
                    phone: normalizedPhone,
                    email: email || null,
                    preferred_time: preferredTime,
                    notes: baseNotes || null,
                    status: 'new',
                    source: source || 'website',
                    source_page: source_page || 'unknown',
                    utm_source: utm_params?.utm_source || null,
                    utm_campaign: utm_params?.utm_campaign || null,
                    center_id: resolvedCenterId,
                    user_id: user_id || null,
                    session_id: session_id || null,
                    metadata
                })
                .select()

            data = response.data
            error = response.error
        }

        if (error) {
            console.error('Database Error:', error)
            throw error
        }

        return new Response(
            JSON.stringify({
                message: 'Submission successful',
                id: data[0].id
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
