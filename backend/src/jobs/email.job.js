/**
 * Email Worker
 * Processes email queue and sends emails via Nodemailer with Handlebars templates
 *
 * NOTE: Worker is lazily initialized only when Redis is available
 */
import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getRedisConnectionInstance, getEmailQueue, isRedisAvailable } from './scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// Lazy-initialized worker
let _emailWorker = null;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  }
});

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@skillmaster.edu.vn';

const templateCache = new Map();
const MAX_CACHE_SIZE = 50;

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Template name sanitization - only allow alphanumeric, underscore, hyphen
function sanitizeTemplateName(templateName) {
  return templateName.replace(/[^a-zA-Z0-9_-]/g, '');
}

function ensureTemplatesDir() {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
    console.log(`📁 Created templates directory: ${TEMPLATES_DIR}`);
  }
}

function loadTemplate(templateName) {
  // Sanitize template name to prevent path traversal
  const sanitizedName = sanitizeTemplateName(templateName);
  if (sanitizedName !== templateName) {
    console.warn(`⚠️ Template name sanitized: ${templateName} -> ${sanitizedName}`);
  }

  if (templateCache.has(sanitizedName)) {
    return templateCache.get(sanitizedName);
  }

  const templatePath = path.join(TEMPLATES_DIR, `${sanitizedName}.hbs`);

  if (!fs.existsSync(templatePath)) {
    console.warn(`⚠️ Template not found: ${templatePath}`);
    return null;
  }

  try {
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const compiledTemplate = Handlebars.compile(templateSource);

    // Limit cache size to prevent memory leaks
    if (templateCache.size >= MAX_CACHE_SIZE) {
      const firstKey = templateCache.keys().next().value;
      templateCache.delete(firstKey);
    }

    templateCache.set(sanitizedName, compiledTemplate);
    return compiledTemplate;
  } catch (error) {
    console.error(`❌ Error loading template ${templateName}:`, error.message);
    return null;
  }
}

function loadPartials() {
  const partialsDir = path.join(TEMPLATES_DIR, 'partials');
  
  if (!fs.existsSync(partialsDir)) {
    return;
  }

  try {
    const partialFiles = fs.readdirSync(partialsDir);
    
    for (const file of partialFiles) {
      if (file.endsWith('.hbs')) {
        const partialName = file.replace('.hbs', '');
        const partialPath = path.join(partialsDir, file);
        const partialSource = fs.readFileSync(partialPath, 'utf-8');
        Handlebars.registerPartial(partialName, partialSource);
      }
    }
    
    console.log(`📄 Loaded ${partialFiles.length} email partials`);
  } catch (error) {
    console.error('❌ Error loading partials:', error.message);
  }
}

function generateFallbackHtml(data) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>${data.subject || 'Notification'}</h2>
      <p>Hello ${data.studentName || data.name || 'User'},</p>
      <p>This is an automated notification from Skill Master.</p>
      <pre>${JSON.stringify(data, null, 2)}</pre>
      <p>Best regards,<br>Skill Master Team</p>
    </div>
  `;
}

async function processEmailJob(job) {
  const { to, subject, template, data } = job.data;

  // Validate email address
  if (!to || !EMAIL_REGEX.test(to)) {
    throw new Error(`Invalid email address: ${to}`);
  }

  console.log(`📧 Processing email job ${job.id}: ${template} -> ${to}`);

  const compiledTemplate = loadTemplate(template);
  
  let html;
  if (compiledTemplate) {
    html = compiledTemplate({ ...data, subject });
  } else {
    console.warn(`⚠️ Using fallback template for: ${template}`);
    html = generateFallbackHtml({ ...data, subject });
  }

  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error;
  }
}

ensureTemplatesDir();
loadPartials();

// Lazy initialization of worker - only creates when Redis is available
function getEmailWorker() {
  if (_emailWorker) {
    return _emailWorker;
  }

  if (!isRedisAvailable()) {
    return null;
  }

  _emailWorker = new Worker(
    'email',
    processEmailJob,
    {
      connection: getRedisConnectionInstance(),
      concurrency: 5
    }
  );

  _emailWorker.on('completed', (job, result) => {
    console.log(`✅ Email job ${job.id} completed: ${result.messageId}`);
  });

  _emailWorker.on('failed', (job, error) => {
    console.error(`❌ Email job ${job?.id} failed:`, error.message);
  });

  return _emailWorker;
}

// Getter that returns the worker (creates if needed and Redis available)
const emailWorker = {
  get instance() {
    return getEmailWorker();
  },
  async close() {
    if (_emailWorker) {
      await _emailWorker.close();
      _emailWorker = null;
    }
  }
};

async function sendEmail(to, subject, template, data) {
  if (!isRedisAvailable()) {
    console.warn('⚠️ Redis not available. Email not queued:', to, subject);
    return null;
  }
  const queue = getEmailQueue();
  if (!queue) {
    console.warn('⚠️ Email queue not available:', to, subject);
    return null;
  }
  const job = await queue.add('send-email', { to, subject, template, data });
  return job;
}

export { emailWorker, sendEmail };

