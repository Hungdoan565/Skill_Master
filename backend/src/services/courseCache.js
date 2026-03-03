import { supabase } from '../lib/db.js';

/**
 * In-memory course data cache per center
 * Map<centerId, { data, expiresAt }>
 */
const courseCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get course data for a center (cached)
 * Returns structured course info for LLM context injection
 */
export async function getCourseData(centerId) {
  const now = Date.now();
  const cached = courseCache.get(centerId);

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  try {
    // Step 1: Query classes for this center first (courses don't have center_id)
    const { data: classData, error: classesError } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        course_id,
        schedule,
        start_date,
        end_date,
        max_students,
        current_students,
        status,
        teacher_id
      `)
      .eq('center_id', centerId)
      .in('status', ['active', 'upcoming']);

    let classes = [];
    if (!classesError) {
      classes = classData || [];
    }

    // Step 2: Get unique course IDs from classes
    const courseIds = [...new Set(classes.map(c => c.course_id).filter(Boolean))];
    let courses = [];

    if (courseIds.length > 0) {
      const { data: courseData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          price,
          duration_weeks,
          level,
          category,
          syllabus,
          features,
          outcomes,
          faq,
          status,
          prerequisites,
          target_audience,
          slug
        `)
        .in('id', courseIds)
        .eq('status', 'active');

      if (!coursesError) {
        courses = courseData || [];
      }
    } else {
      // Fallback: no classes linked to center, load all active courses
      const { data: courseData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          price,
          duration_weeks,
          level,
          category,
          syllabus,
          features,
          outcomes,
          faq,
          status,
          prerequisites,
          target_audience,
          slug
        `)
        .eq('status', 'active')
        .limit(30);

      if (!coursesError) {
        courses = courseData || [];
      }
    }

    // Query active FAQs for chatbot
    let faqs = [];
    const { data: faqData, error: faqError } = await supabase
      .from('chatbot_faqs')
      .select('category, question, answer')
      .eq('center_id', centerId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(30);

    if (!faqError) {
      faqs = faqData || [];
    }

    // Query center info
    let centerInfo = null;
    try {
      const { data: centerData, error: centerError } = await supabase
        .from('centers')
        .select('*')
        .eq('id', centerId)
        .single();

      if (!centerError && centerData) {
        centerInfo = {
          name: centerData.name || null,
          phone: centerData.hotline || null,
          email: centerData.email || null,
          address: centerData.address || null,
          website: null,
          operatingHours: centerData.working_hours || null
        };
      }
    } catch (e) {
      // Center info query failed - continue without it
    }

    // Query teachers from classes
    let teachers = [];
    const teacherIds = [...new Set(classes.filter(c => c.teacher_id).map(c => c.teacher_id))];
    if (teacherIds.length > 0) {
      const { data: teacherData, error: teacherError } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', teacherIds)
        .limit(20);

      if (!teacherError) {
        teachers = (teacherData || []).map(t => ({
          name: t.full_name
        }));
      }
    }

    // Structure data for LLM context
    const structuredData = {
      courses: courses?.map(course => ({
        slug: course.slug,
        name: course.title,
        description: course.description,
        price: course.price ? `${Number(course.price).toLocaleString('vi-VN')}đ` : 'Liên hệ',
        originalPrice: null,
        duration: course.duration_weeks ? `${course.duration_weeks} tuần` : null,
        level: course.level,
        category: course.category,
        prerequisites: course.prerequisites,
        targetAudience: course.target_audience,
        syllabus: course.syllabus,
        features: course.features,
        learningOutcomes: course.outcomes,
        faq: course.faq,
        availableClasses: classes
          .filter(c => c.course_id === course.id)
          .map(c => ({
            name: c.name,
            schedule: c.schedule,
            startDate: c.start_date,
            endDate: c.end_date,
            spotsLeft: c.max_students ? c.max_students - (c.current_students || 0) : null,
            status: c.status
          }))
      })),
      totalCourses: courses?.length || 0,
      faqs: faqs,
      centerInfo: centerInfo,
      teachers: teachers,
      lastUpdated: new Date().toISOString()
    };

    // Cache the result
    courseCache.set(centerId, {
      data: structuredData,
      expiresAt: now + CACHE_TTL_MS
    });

    return structuredData;
  } catch (error) {
    console.error('Error in getCourseData:', error);
    return null;
  }
}

/**
 * Invalidate cache for a specific center
 */
export function invalidateCourseCache(centerId) {
  if (centerId) {
    courseCache.delete(centerId);
  } else {
    courseCache.clear();
  }
}
