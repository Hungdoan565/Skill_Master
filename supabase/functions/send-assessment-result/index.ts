import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Step 1: Parse request
    const { attemptId } = await req.json()
    console.log('Step 1: Received attemptId:', attemptId)

    if (!attemptId) {
      throw new Error('Missing attemptId')
    }

    // Step 2: Check environment variables
    console.log('Step 2: Checking env vars...')
    console.log('SUPABASE_URL exists:', !!SUPABASE_URL)
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!SUPABASE_SERVICE_ROLE_KEY)
    console.log('RESEND_API_KEY exists:', !!RESEND_API_KEY)

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    // Step 3: Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    console.log('Step 3: Supabase client initialized')

    // Step 4: Fetch attempt (simple query first)
    console.log('Step 4: Fetching attempt...')
    const { data: attempt, error: attemptError } = await supabase
      .from('assessment_attempts')
      .select('*, assessment_tests(id, title, slug, category)')
      .eq('id', attemptId)
      .single()

    if (attemptError) {
      console.error('Attempt fetch error:', attemptError)
      throw new Error('Failed to fetch attempt: ' + attemptError.message)
    }

    console.log('Step 4: Attempt found:', attempt.id)
    console.log('Step 4: guest_email:', attempt.guest_email)
    console.log('Step 4: user_id:', attempt.user_id)

    // Step 5: Get user email if logged in
    let recipientEmail = attempt.guest_email
    let recipientName = attempt.guest_name || 'Học viên'

    if (!recipientEmail && attempt.user_id) {
      console.log('Step 5: Fetching user info for user_id:', attempt.user_id)
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', attempt.user_id)
        .single()

      if (userError) {
        console.error('User fetch error:', userError)
      } else if (user) {
        recipientEmail = user.email
        recipientName = user.full_name || 'Học viên'
        console.log('Step 5: Found user email:', recipientEmail)
      }
    }

    if (!recipientEmail) {
      throw new Error('No email address found for attempt')
    }

    console.log('Step 5: Will send to:', recipientEmail, '(' + recipientName + ')')

    // Step 6: Check if already sent
    if (attempt.email_sent) {
      console.log('Step 6: Email already sent, skipping')
      return new Response(
        JSON.stringify({ success: true, message: 'Email already sent' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 7: Build email content
    const scorePercent = Math.round((attempt.score / attempt.max_score) * 100)
    const testTitle = attempt.assessment_tests?.title || 'Bài kiểm tra'

    const emailHTML = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #FF4D00, #FF6B2C); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">🎓 SKILL MASTER</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Kết quả bài kiểm tra</p>
  </div>
  <div style="background: white; padding: 30px; border: 1px solid #eee; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1a1a1a;">Xin chào ${recipientName}! 👋</h2>
    <p>Cảm ơn bạn đã hoàn thành bài kiểm tra <strong>${testTitle}</strong>.</p>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
      <p style="margin: 0; color: #666;">Điểm số của bạn</p>
      <h1 style="color: #FF4D00; font-size: 48px; margin: 10px 0;">${scorePercent}%</h1>
      <p style="margin: 0; color: #666;">${attempt.score}/${attempt.max_score} câu đúng</p>
    </div>
    <p>Đăng ký khóa học ngay để nâng cao trình độ của bạn!</p>
    <a href="https://skillmaster.edu.vn" style="display: inline-block; background: #FF4D00; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Xem khóa học</a>
  </div>
  <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 Skill Master</p>
</body>
</html>`

    console.log('Step 7: Email HTML built')

    // Step 8: Send email via Resend
    console.log('Step 8: Sending email via Resend...')
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Skill Master <onboarding@resend.dev>',
        to: [recipientEmail],
        subject: 'Kết quả test ' + testTitle + ' - Skill Master',
        html: emailHTML
      })
    })

    const resendData = await resendResponse.json()
    console.log('Step 8: Resend response status:', resendResponse.status)
    console.log('Step 8: Resend response data:', JSON.stringify(resendData))

    if (!resendResponse.ok) {
      throw new Error('Resend API error: ' + (resendData.message || JSON.stringify(resendData)))
    }

    // Step 9: Log email
    console.log('Step 9: Logging email...')
    await supabase.from('email_logs').insert({
      attempt_id: attemptId,
      recipient_email: recipientEmail,
      email_type: 'assessment_result',
      status: 'sent',
      resend_id: resendData.id
    })

    // Step 10: Update attempt
    console.log('Step 10: Updating attempt...')
    await supabase
      .from('assessment_attempts')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString()
      })
      .eq('id', attemptId)

    console.log('Step 10: Done! Email sent successfully')

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('ERROR:', error.message || error)

    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
