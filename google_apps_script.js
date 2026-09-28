// ============================================
// GSJ Website — Supabase → Google Sheet Sync
// Deploy as Web App to receive Supabase webhooks
// ============================================

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    
    // Supabase webhook payload structure
    const table = payload.table;
    const record = payload.record;
    const type = payload.type;
    
    if (type !== 'INSERT') {
      return ContentService.createTextOutput(JSON.stringify({ status: 'skipped' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const ss = getOrCreateSpreadsheet();
    
    switch (table) {
      case 'contact_submissions':
        appendContactSubmission(ss, record);
        break;
      case 'mentor_applications':
        appendMentorApplication(ss, record);
        break;
      case 'question_submissions':
        appendQuestionSubmission(ss, record);
        break;
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', table: table }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  let sheetId = props.getProperty('SHEET_ID');
  
  if (sheetId) {
    try { return SpreadsheetApp.openById(sheetId); } catch (e) {}
  }
  
  const ss = SpreadsheetApp.create('GSJ Website — Form Submissions');
  sheetId = ss.getId();
  props.setProperty('SHEET_ID', sheetId);
  
  const contactSheet = ss.getActiveSheet();
  contactSheet.setName('Contact Submissions');
  contactSheet.appendRow(['Timestamp', 'Full Name', 'Email', 'Subject', 'Message', 'ID']);
  formatHeaderRow(contactSheet);
  
  const mentorSheet = ss.insertSheet('Mentor Applications');
  mentorSheet.appendRow([
    'Timestamp', 'First Name', 'Last Name', 'Email', 'Phone',
    'Project Title', 'Project Overview', 'Research Field',
    'Availability', 'Mode of Engagement', 'Prior Experience',
    'Student Responsibilities', 'Ideal Student Profile',
    'Skills & Learning Outcomes', 'Weekly Time Commitment',
    'Additional Info', 'How Heard', 'ID'
  ]);
  formatHeaderRow(mentorSheet);
  
  const questionSheet = ss.insertSheet('Question Submissions');
  questionSheet.appendRow(['Timestamp', 'Full Name', 'Email', 'Question', 'ID']);
  formatHeaderRow(questionSheet);
  
  return ss;
}

function formatHeaderRow(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#0F4C81');
  headerRange.setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
  sheet.setColumnWidths(1, sheet.getLastColumn(), 150);
}

function appendContactSubmission(ss, record) {
  ss.getSheetByName('Contact Submissions').appendRow([
    formatTimestamp(record.created_at), record.full_name || '', record.email || '',
    record.subject || '', record.message || '', record.id || ''
  ]);
}

function appendMentorApplication(ss, record) {
  ss.getSheetByName('Mentor Applications').appendRow([
    formatTimestamp(record.created_at), record.first_name || '', record.last_name || '',
    record.email || '', record.phone || '', record.project_title || '',
    record.project_overview || '', record.research_field || '', record.availability || '',
    record.mode_of_engagement || '', record.prior_experience || '',
    record.student_responsibilities || '', record.ideal_student_profile || '',
    record.skills_learning_outcomes || '', record.weekly_time_commitment || '',
    record.additional_info || '', record.how_heard || '', record.id || ''
  ]);
}

function appendQuestionSubmission(ss, record) {
  ss.getSheetByName('Question Submissions').appendRow([
    formatTimestamp(record.created_at), record.full_name || '', record.email || '',
    record.question || '', record.id || ''
  ]);
}

function formatTimestamp(ts) {
  if (!ts) return new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  return new Date(ts).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

// Run this first to create the Google Sheet
function setupSheet() {
  const ss = getOrCreateSpreadsheet();
  Logger.log('Sheet URL: ' + ss.getUrl());
}
