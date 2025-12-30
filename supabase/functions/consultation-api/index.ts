import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Initialize Supabase Client with Service Role Key (to bypass RLS for inserts if needed, or just standard admin access)
        // IMPORTANT: Make sure SUPABASE_SERVICE_ROLE_KEY is set in your project secrets
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const reqData = await req.json()
        const {
            name, phone, email, // Common fields
            goal, level, callTime, // Consultation fields
            timeSlot, course, // Booking fields
            source, source_page, utm_params
        } = reqData

        // Basic Validation
        if (!name || !phone) {
            throw new Error('Họ tên và số điện thoại là bắt buộc')
        }

        // Insert into database
        const { data, error } = await supabaseClient
            .from('consultation_leads')
            .insert({
                full_name: name,
                phone,
                email,
                message: reqData.message || null, // Add message field
                goal,
                level,
                time_slot: timeSlot || callTime, // Map callTime to time_slot if generic
                course,
                source: source || 'unknown',
                source_page: source_page || 'unknown',
                utm_params: utm_params || {},
                status: 'new'
            })
            .select()

        if (error) {
            console.error('Database Error:', error)
            throw error
        }

        // Optional: Send Email Notification (Mock or Implement later)
        // await sendEmailNotification(data[0])

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
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
