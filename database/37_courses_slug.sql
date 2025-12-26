-- ============================================================
-- MIGRATION: Add slug column to courses table
-- Version: 37
-- Description: Thêm cột slug để hỗ trợ SEO-friendly URLs
-- ============================================================

-- 1. Add slug column to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 2. Generate slug from existing courses (code -> slug)
UPDATE public.courses 
SET slug = LOWER(REPLACE(REPLACE(code, ' ', '-'), '_', '-'))
WHERE slug IS NULL;

-- 3. Create function to auto-generate slug from title
CREATE OR REPLACE FUNCTION generate_course_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    new_slug TEXT;
    counter INT := 0;
BEGIN
    -- Generate base slug from title
    base_slug := LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                TRANSLATE(
                    NEW.title,
                    'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ',
                    'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiioooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD'
                ),
                '[^a-zA-Z0-9\s-]', '', 'g'
            ),
            '\s+', '-', 'g'
        )
    );
    
    new_slug := base_slug;
    
    -- Check for uniqueness and append counter if needed
    WHILE EXISTS(SELECT 1 FROM public.courses WHERE slug = new_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')) LOOP
        counter := counter + 1;
        new_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := new_slug;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to auto-generate slug on insert
DROP TRIGGER IF EXISTS courses_generate_slug ON public.courses;
CREATE TRIGGER courses_generate_slug
    BEFORE INSERT ON public.courses
    FOR EACH ROW
    WHEN (NEW.slug IS NULL)
    EXECUTE FUNCTION generate_course_slug();

-- 5. Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);

-- ============================================================
-- DONE: Run this migration in Supabase SQL Editor
-- ============================================================
