import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase, getDbStatus } from './lib/db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  const status = await getDbStatus();
  res.json({ service: 'skill-master-backend', ...status });
});

app.get('/api/status', async (_req, res, next) => {
  try {
    const status = await getDbStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
});

app.get('/api/courses', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching courses:', error);
    next(error);
  }
});

app.use((err, _req, res, _next) => {
  console.error('🔥 Lỗi hệ thống:', err); // Log ra terminal để em xem
  
  // Trả về lỗi chi tiết cho Frontend thấy (chỉ nên làm vậy ở môi trường Dev)
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error', 
    error: err.message // Thêm dòng này để FE biết lỗi gì
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
