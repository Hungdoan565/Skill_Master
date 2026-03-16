import { getGroqClient, isGroqAvailable } from './groq.js';
import { getCourseData } from './courseCache.js';
import { supabase } from '../lib/db.js';

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';
const MAX_TOKENS = 800;
const FALLBACK_MAX_TOKENS = 512;
const MAX_HISTORY = 15;
const MAX_SESSION_MESSAGES = 20;

/**
 * Build Molly's system prompt with context injection
 */
function buildSystemPrompt(courseData, studentData = null, courseSlug = null, faqData = [], centerInfo = null, teacherData = []) {
  const basePrompt = `Bạn là Molly — trợ lý AI của Skill Master Academy. Nhiệm vụ: tư vấn học viên về khóa học, lộ trình, học phí, lịch học và chính sách trung tâm.

## Tính cách
- Xưng "mình", gọi người dùng là "bạn"
- Thân thiện, hòa đồng, nhiệt tình nhưng chuyên nghiệp
- Trả lời ngắn gọn, dưới 200 từ mỗi tin nhắn
- Dùng tối đa 1-2 emoji mỗi tin nhắn (chỉ emoji chuẩn, không lạm dụng)
- Luôn trả lời bằng tiếng Việt

## Chính sách trung tâm
- Hoàn tiền: 100% nếu hủy trước khi khóa học bắt đầu, 70% nếu hủy trong tuần đầu tiên, 0% sau tuần đầu
- Bảo lưu: tối đa 30 ngày cho khóa ngắn hạn, 3 tháng cho khóa dài hạn. Phí bảo lưu: miễn phí lần đầu, 200.000đ/lần từ lần 2
- Chuyển lớp: miễn phí 1 lần nếu còn slot, phí 100.000đ từ lần 2
- Thanh toán: chuyển khoản ngân hàng hoặc tiền mặt tại trung tâm. Trả góp: liên hệ tư vấn viên
- Cam kết: học lại miễn phí 1 lần nếu không đạt yêu cầu đầu ra (áp dụng học viên đi học đầy đủ ≥80% buổi)

## Quy tắc bắt buộc
- KHÔNG bịa thông tin. Nếu không biết, nói "Mình chưa có thông tin này, bạn liên hệ hotline hoặc để lại thông tin để tư vấn viên hỗ trợ nhé!"
- KHÔNG tư vấn ngoài phạm vi giáo dục/trung tâm
- KHÔNG cam kết kết quả học tập cụ thể (ví dụ: "chắc chắn đỗ", "100% có việc")
- KHÔNG tiết lộ thông tin của học viên khác
- KHÔNG trả lời câu hỏi về chính trị, tôn giáo, hoặc chủ đề nhạy cảm
- Khi học viên quan tâm đến khóa học, so sánh khóa học, hỏi về đăng ký, lịch học, học phí, thể hiện ý định đăng ký rõ ràng, muốn liên hệ tư vấn viên, cần hỗ trợ từ con người, yêu cầu form liên hệ, hoặc gặp vấn đề mà AI không giải quyết được → thêm dòng sau vào CUỐI tin nhắn trên một dòng riêng: [LEAD_INTENT]
- KHÔNG BAO GIỜ tự tạo form liên hệ bằng text. Khi cần thu thập thông tin liên hệ, chỉ cần thêm [LEAD_INTENT] — hệ thống sẽ tự hiện form cho người dùng.

## Dữ liệu khóa học hiện tại`;

  let prompt = basePrompt;

  // Inject course data
  if (courseData && courseData.courses.length > 0) {
    prompt += `\n\nTrung tâm hiện có ${courseData.totalCourses} khóa học:\n`;
    for (const course of courseData.courses) {
      prompt += `\n### ${course.name}`;
      if (course.description) prompt += `\n- Mô tả: ${course.description}`;
      if (course.price) prompt += `\n- Học phí: ${course.price}`;
      if (course.originalPrice) prompt += ` (giá gốc: ${course.originalPrice})`;
      if (course.duration) prompt += `\n- Thời lượng: ${course.duration}`;
      if (course.level) prompt += `\n- Trình độ: ${course.level}`;
      if (course.category) prompt += `\n- Danh mục: ${course.category}`;

      if (course.prerequisites) prompt += `\n- Yêu cầu đầu vào: ${typeof course.prerequisites === 'string' ? course.prerequisites : JSON.stringify(course.prerequisites)}`;
      if (course.targetAudience) prompt += `\n- Đối tượng: ${typeof course.targetAudience === 'string' ? course.targetAudience : JSON.stringify(course.targetAudience)}`;

      if (course.syllabus && Array.isArray(course.syllabus) && course.syllabus.length > 0) {
        prompt += `\n- Nội dung chính: ${course.syllabus.map(s => typeof s === 'string' ? s : s.title || s.name).join(', ')}`;
      }

      if (course.learningOutcomes && Array.isArray(course.learningOutcomes) && course.learningOutcomes.length > 0) {
        prompt += `\n- Kết quả đầu ra: ${course.learningOutcomes.join(', ')}`;
      }

      if (course.features && Array.isArray(course.features) && course.features.length > 0) {
        prompt += `\n- Đặc điểm: ${course.features.join(', ')}`;
      }

      if (course.availableClasses && course.availableClasses.length > 0) {
        prompt += `\n- Lớp đang mở:`;
        for (const cls of course.availableClasses) {
          prompt += `\n  + ${cls.name}`;
          if (cls.schedule) prompt += ` | Lịch: ${typeof cls.schedule === 'string' ? cls.schedule : JSON.stringify(cls.schedule)}`;
          if (cls.startDate) prompt += ` | Bắt đầu: ${cls.startDate}`;
          if (cls.spotsLeft !== null) prompt += ` | Còn ${cls.spotsLeft} chỗ`;
        }
      }

      if (course.faq && Array.isArray(course.faq) && course.faq.length > 0) {
        prompt += `\n- FAQ:`;
        for (const item of course.faq.slice(0, 3)) {
          if (item.question && item.answer) {
            prompt += `\n  Q: ${item.question}`;
            prompt += `\n  A: ${item.answer}`;
          }
        }
      }
    }
  } else {
    prompt += "\nHiện chưa có danh sách khóa học cụ thể. Hãy tư vấn dựa trên thông tin FAQ và thông tin trung tâm bên dưới (nếu có). Nếu khách hỏi chi tiết khóa học cụ thể mà không có trong dữ liệu, hướng dẫn liên hệ hotline.";
  }

  // Inject FAQ data
  if (faqData && faqData.length > 0) {
    prompt += '\n\n## C\u00c2U H\u1eceI TH\u01af\u1edcNG G\u1eb6P';
    const catLabels = { enrollment: '\u0110\u0103ng k\u00fd', payment: 'Thanh to\u00e1n', policy: 'Ch\u00ednh s\u00e1ch', schedule: 'L\u1ecbch h\u1ecdc', general: 'Chung' };
    const categories = [...new Set(faqData.map(f => f.category))];
    for (const cat of categories) {
      const catFaqs = faqData.filter(f => f.category === cat);
      prompt += '\n\n### ' + (catLabels[cat] || cat);
      for (const faq of catFaqs) {
        prompt += '\nQ: ' + faq.question;
        prompt += '\nA: ' + faq.answer;
      }
    }
  }

  // Inject center contact info
  if (centerInfo) {
    prompt += '\n\n## TH\u00d4NG TIN LI\u00caN H\u1ec6 TRUNG T\u00c2M';
    if (centerInfo.name) prompt += '\n- T\u00ean trung t\u00e2m: ' + centerInfo.name;
    if (centerInfo.phone) prompt += '\n- Hotline: ' + centerInfo.phone;
    if (centerInfo.email) prompt += '\n- Email: ' + centerInfo.email;
    if (centerInfo.address) prompt += '\n- \u0110\u1ecba ch\u1ec9: ' + centerInfo.address;
    if (centerInfo.website) prompt += '\n- Website: ' + centerInfo.website;
    if (centerInfo.operatingHours) prompt += '\n- Gi\u1edd ho\u1ea1t \u0111\u1ed9ng: ' + centerInfo.operatingHours;
  }

  // Inject teacher info
  if (teacherData && teacherData.length > 0) {
    prompt += '\n\n## \u0110\u1ed8I NG\u0168 GI\u00c1O VI\u00caN';
    for (const teacher of teacherData.slice(0, 20)) {
      prompt += '\n- ' + teacher.name;
      if (teacher.subjects) prompt += ' (' + teacher.subjects + ')';
    }
  }

  // If courseSlug provided, highlight that specific course
  if (courseSlug && courseData && courseData.courses.length > 0) {
    const focusCourse = courseData.courses.find(c => c.slug === courseSlug);
    if (focusCourse) {
      prompt += `\n\n⭐ Khách hàng đang xem khóa "${focusCourse.name}". Ưu tiên tư vấn về khóa này, nhưng vẫn giới thiệu khóa khác nếu phù hợp hơn.`;
    }
  }

  // Inject student-specific data for authenticated mode
  if (studentData) {
    prompt += `\n\n## Thông tin học viên (chế độ cá nhân)`;
    prompt += `\n- Tên: ${studentData.fullName}`;

    if (studentData.enrollments && studentData.enrollments.length > 0) {
      prompt += `\n- Đang học:`;
      for (const e of studentData.enrollments) {
        prompt += `\n  + ${e.courseName}${e.className ? ` (${e.className})` : ''}`;
        if (e.status) prompt += ` — ${e.status}`;
      }
    }

    if (studentData.recentAssessments && studentData.recentAssessments.length > 0) {
      prompt += `\n- Kết quả gần đây:`;
      for (const a of studentData.recentAssessments) {
        prompt += `\n  + ${a.title}: ${a.score}/${a.maxScore}`;
      }
    }
  }

  return prompt;
}

/**
 * Load student-specific data for authenticated mode
 */
async function loadStudentData(userId, centerId) {
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    // Get active enrollments
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        status,
        courses(title),
        classes(name)
      `)
      .eq('student_id', userId)
      .in('status', ['active', 'enrolled']);

    // Get recent assessments (last 5)
    const { data: assessments } = await supabase
      .from('assessment_results')
      .select(`
        score,
        max_score,
        assessments(title)
      `)
      .eq('student_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      fullName: profile?.full_name || 'Học viên',
      enrollments: enrollments?.map(e => ({
        courseName: e.courses?.title,
        className: e.classes?.name,
        status: e.status
      })) || [],
      recentAssessments: assessments?.map(a => ({
        title: a.assessments?.title,
        score: a.score,
        maxScore: a.max_score
      })) || []
    };
  } catch (error) {
    console.error('Error loading student data:', error);
    return null;
  }
}

/**
 * Load conversation history for a session
 */
async function loadConversationHistory(sessionId) {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(MAX_HISTORY);

    if (error) throw error;

    return (data || []).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  } catch (error) {
    console.error('Error loading conversation history:', error);
    return [];
  }
}

/**
 * Create or get existing chat session
 */
async function getOrCreateSession(sessionId, visitorId, userId, centerId) {
  // Try to find existing session
  if (sessionId) {
    const { data: existing } = await supabase
      .from('chat_sessions')
      .select('id, message_count')
      .eq('id', sessionId)
      .single();

    if (existing) {
      return { id: existing.id, messageCount: existing.message_count, isNew: false };
    }
  }

  // Create new session
  const { data: newSession, error } = await supabase
    .from('chat_sessions')
    .insert({
      visitor_id: visitorId || null,
      user_id: userId || null,
      center_id: centerId
    })
    .select('id')
    .single();

  if (error) throw error;

  return { id: newSession.id, messageCount: 0, isNew: true };
}

/**
 * Save message to database (async, non-blocking)
 */
async function saveMessage(sessionId, role, content, tokensUsed = null, model = null) {
  try {
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role,
      content,
      tokens_used: tokensUsed,
      model
    });

    // Update session stats — increment message_count directly
    const { data: sessionData } = await supabase
      .from('chat_sessions')
      .select('message_count')
      .eq('id', sessionId)
      .single();

    if (sessionData) {
      await supabase
        .from('chat_sessions')
        .update({
          message_count: (sessionData.message_count || 0) + 1,
          last_message_at: new Date().toISOString()
        })
        .eq('id', sessionId);
    }
  } catch (error) {
    console.error('Error saving message:', error);
  }
}

/**
 * Stream chat completion from Groq
 */
async function streamChatCompletion(messages, res, sessionId, model = GROQ_MODEL) {
  const groq = getGroqClient();

  if (!groq) {
    return { error: 'service_unavailable', message: 'Molly đang nghỉ ngơi. Vui lòng liên hệ tư vấn viên trực tiếp!' };
  }

  const isUsingFallback = model === FALLBACK_MODEL;
  const maxTokens = isUsingFallback ? FALLBACK_MAX_TOKENS : MAX_TOKENS;
  const temperature = isUsingFallback ? 0.3 : 0.5;

  try {
    const stream = await groq.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      top_p: 1.0,
      stream: true
    });

    let fullResponse = '';
    let totalTokens = 0;
    let hasLeadIntent = false;
    let sendBuffer = '';
    const MARKER = '[LEAD_INTENT]';

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta;
      const finishReason = chunk.choices?.[0]?.finish_reason;

      if (delta?.content) {
        fullResponse += delta.content;
        sendBuffer += delta.content;

        // Check if full marker is in buffer - strip it
        if (sendBuffer.includes(MARKER)) {
          hasLeadIntent = true;
          sendBuffer = sendBuffer.replace(MARKER, '');
        }

        // Check if buffer might end with a partial marker start
        // e.g. sendBuffer ends with '[', '[L', '[LE', ... '[LEAD_INTEN'
        let safeEnd = sendBuffer.length;
        for (let i = 1; i <= Math.min(MARKER.length - 1, sendBuffer.length); i++) {
          const tail = sendBuffer.slice(-i);
          if (MARKER.startsWith(tail)) {
            safeEnd = sendBuffer.length - i;
            break;
          }
        }

        // Send only the safe portion
        const safeContent = sendBuffer.slice(0, safeEnd);
        if (safeContent) {
          res.write(`data: ${JSON.stringify({ type: 'token', content: safeContent })}

`);
        }
        sendBuffer = sendBuffer.slice(safeEnd);
      }

      if (finishReason === 'stop') {
        totalTokens = chunk.usage?.total_tokens || 0;
      }
    }

    // Flush remaining buffer (strip any marker)
    if (sendBuffer) {
      const finalContent = sendBuffer.replace(MARKER, '');
      if (finalContent) {
        hasLeadIntent = hasLeadIntent || sendBuffer.includes(MARKER);
        res.write(`data: ${JSON.stringify({ type: 'token', content: finalContent })}

`);
      }
    }

    // Clean the full response of lead intent markers
    const cleanResponse = fullResponse.replace(/\n?\[LEAD_INTENT\]\n?/g, '').trim();

    // Send done event
    res.write(`data: ${JSON.stringify({ type: 'done', tokensUsed: totalTokens, model })}\n\n`);

    // Send lead trigger event after done
    if (hasLeadIntent) {
      res.write(`data: ${JSON.stringify({ type: 'lead_trigger' })}\n\n`);
    }

    // Save assistant message async
    saveMessage(sessionId, 'assistant', cleanResponse, totalTokens, model);

    return { success: true, response: cleanResponse };
  } catch (error) {
    console.error(`Groq streaming error (${model}):`, error);

    const statusCode = error.status || error.statusCode || 500;

    // Fallback to secondary model on rate limit or service error
    if (!isUsingFallback && (statusCode === 429 || statusCode === 503)) {
      console.log(`Primary model ${GROQ_MODEL} failed (${statusCode}), falling back to ${FALLBACK_MODEL}`);
      return streamChatCompletion(messages, res, sessionId, FALLBACK_MODEL);
    }

    const errorMessage = statusCode === 429
      ? 'Molly đang bận lắm! Bạn thử lại sau vài giây nhé.'
      : 'Molly gặp sự cố. Bạn thử lại sau nhé!';

    return { error: statusCode === 429 ? 'rate_limited' : 'api_error', message: errorMessage, status: statusCode };
  }
}

/**
 * Generate AI conversation title from first exchange
 * Uses small/fast model (llama-3.1-8b-instant) — fire-and-forget
 */
async function generateConversationTitle(userMessage, assistantResponse) {
  try {
    const groq = getGroqClient();
    if (!groq) return 'Cuộc trò chuyện mới';

    const titleResult = await groq.chat.completions.create({
      model: FALLBACK_MODEL,
      messages: [
        { role: 'system', content: 'Tóm tắt cuộc hội thoại thành tiêu đề ngắn 3-6 từ tiếng Việt. CHỈ trả lời tiêu đề, không giải thích.' },
        { role: 'user', content: userMessage.trim() },
        { role: 'assistant', content: (assistantResponse || '').substring(0, 200) }
      ],
      max_tokens: 30,
      temperature: 0.3
    });

    const title = titleResult.choices?.[0]?.message?.content?.trim();
    // Strip quotes if the model wraps it
    return title ? title.replace(/^["'""]|["'""]$/g, '').trim() || 'Cuộc trò chuyện mới' : 'Cuộc trò chuyện mới';
  } catch (error) {
    console.error('Auto-title generation failed:', error.message);
    return 'Cuộc trò chuyện mới';
  }
}

/**
 * Delete all messages after a given timestamp in a session
 * Used for edit & resend flow
 */
async function deleteMessagesAfter(sessionId, afterTimestamp) {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId)
      .gt('created_at', afterTimestamp);

    if (error) throw error;

    // Sync message count
    await syncMessageCount(sessionId);
  } catch (error) {
    console.error('Error deleting messages after timestamp:', error);
    throw error;
  }
}

/**
 * Delete last assistant message for regeneration
 * Returns the preceding user message content for context
 */
async function deleteLastAssistantMessage(sessionId) {
  try {
    // Find last assistant message
    const { data: lastMsg, error: findError } = await supabase
      .from('chat_messages')
      .select('id, created_at')
      .eq('session_id', sessionId)
      .eq('role', 'assistant')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (findError || !lastMsg) return null;

    // Delete it
    await supabase
      .from('chat_messages')
      .delete()
      .eq('id', lastMsg.id);

    // Sync message count
    await syncMessageCount(sessionId);

    // Find the preceding user message
    const { data: userMsg } = await supabase
      .from('chat_messages')
      .select('content')
      .eq('session_id', sessionId)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return userMsg?.content || null;
  } catch (error) {
    console.error('Error deleting last assistant message:', error);
    throw error;
  }
}

/**
 * Sync message_count with actual count (prevents drift after edits/deletes)
 */
async function syncMessageCount(sessionId) {
  const { data: countResult } = await supabase
    .from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId);

  const actualCount = countResult?.length ?? 0;

  // Use raw SQL count via RPC or re-count
  const { count } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId);

  await supabase
    .from('chat_sessions')
    .update({ message_count: count || 0 })
    .eq('id', sessionId);
}

export {
  buildSystemPrompt,
  loadStudentData,
  loadConversationHistory,
  getOrCreateSession,
  saveMessage,
  streamChatCompletion,
  generateConversationTitle,
  deleteMessagesAfter,
  deleteLastAssistantMessage,
  syncMessageCount,
  MAX_SESSION_MESSAGES,
  GROQ_MODEL,
  FALLBACK_MODEL
};
