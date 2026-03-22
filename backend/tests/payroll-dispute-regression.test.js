import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const backendSource = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', 'src', 'index.js'),
  'utf8',
);

const teacherPayrollPageSource = fs.readFileSync(
  path.resolve(
    import.meta.dirname,
    '..',
    '..',
    'frontend',
    'src',
    'features',
    'payroll',
    'pages',
    'TeacherPayrollPage.jsx',
  ),
  'utf8',
);

const disputeManagementPageSource = fs.readFileSync(
  path.resolve(
    import.meta.dirname,
    '..',
    '..',
    'frontend',
    'src',
    'features',
    'payroll',
    'pages',
    'DisputeManagementPage.jsx',
  ),
  'utf8',
);

const approvalInboxPageSource = fs.readFileSync(
  path.resolve(
    import.meta.dirname,
    '..',
    '..',
    'frontend',
    'src',
    'features',
    'approvals',
    'pages',
    'ApprovalInboxPage.jsx',
  ),
  'utf8',
);

const databaseDir = path.resolve(import.meta.dirname, '..', '..', 'database');
const databaseFiles = fs.readdirSync(databaseDir);

test('teacher payroll dispute route only blocks active disputes on finalized payrolls', () => {
  assert.match(
    backendSource,
    /app\.post\('\/api\/teacher\/payroll\/:id\/dispute'[\s\S]*!\['approved', 'paid'\]\.includes\(payroll\.status\)/,
  );

  assert.match(
    backendSource,
    /app\.post\('\/api\/teacher\/payroll\/:id\/dispute'[\s\S]*\.in\('status', \['pending', 'reviewing'\]\)/,
  );
});

test('teacher payroll page uses dispute history to decide if a new dispute can be created', () => {
  assert.match(
    teacherPayrollPageSource,
    /const \{ submitDispute, fetchPayrollDisputes \} = usePayroll\(\);/,
  );

  assert.match(
    teacherPayrollPageSource,
    /const ACTIVE_DISPUTE_STATUSES = \['pending', 'reviewing'\];/,
  );

  assert.match(
    teacherPayrollPageSource,
    /const canCreateDispute = Boolean\(selectedPayroll\) && \['approved', 'paid'\]\.includes\(selectedPayroll\.status\) && !activeDispute;/,
  );

  assert.match(teacherPayrollPageSource, /Lịch sử khiếu nại/);
});

test('active payroll disputes are protected by a DB guard and friendly conflict handling', () => {
  const activeDisputeGuardFile = databaseFiles.find((file) => file.includes('payroll_active_dispute_guard'));

  assert.ok(activeDisputeGuardFile, 'expected a payroll active dispute guard migration');

  const migrationSource = fs.readFileSync(path.resolve(databaseDir, activeDisputeGuardFile), 'utf8');

  assert.match(
    migrationSource,
    /CREATE UNIQUE INDEX[\s\S]*payroll_disputes[\s\S]*\(payroll_id, teacher_id\)[\s\S]*status IN \('pending', 'reviewing'\)/,
  );

  assert.match(
    backendSource,
    /insertError\??\.code === '23505'/,
  );
});

test('payroll dispute realtime updates are wired for teacher and manager screens', () => {
  assert.match(
    teacherPayrollPageSource,
    /supabase\.channel\(/,
  );

  assert.match(
    teacherPayrollPageSource,
    /reference_type === 'payroll_dispute'/,
  );

  assert.match(
    disputeManagementPageSource,
    /supabase\.channel\(/,
  );

  assert.match(
    disputeManagementPageSource,
    /reference_type === 'payroll_dispute'/,
  );

  assert.match(
    approvalInboxPageSource,
    /supabase\.channel\(/,
  );

  assert.match(
    approvalInboxPageSource,
    /reference_type === 'payroll_dispute'/,
  );
});

test('payroll dispute notifications cover teacher status updates and realtime publication', () => {
  const realtimeMigrationFile = databaseFiles.find((file) => file.includes('payroll_dispute_realtime_updates'));

  assert.ok(realtimeMigrationFile, 'expected a payroll dispute realtime update migration');

  const migrationSource = fs.readFileSync(path.resolve(databaseDir, realtimeMigrationFile), 'utf8');

  assert.match(
    migrationSource,
    /ALTER PUBLICATION supabase_realtime ADD TABLE payroll_disputes/,
  );

  assert.match(
    migrationSource,
    /CREATE TRIGGER trigger_notify_teacher_on_payroll_dispute_status/,
  );

  assert.match(
    backendSource,
    /app\.patch\('\/api\/admin\/payroll-disputes\/:id'[\s\S]*createNotification\(/,
  );
});
