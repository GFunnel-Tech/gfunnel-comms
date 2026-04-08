import { IndustryConfig, Campaign, CommMessage, CommTemplate, ReviewTracking } from './types';

export const defaultDentalConfig: IndustryConfig = {
  industry: 'dental',
  labels: {
    person: 'Patient',
    persons: 'Patients',
    provider: 'Dentist',
    service: 'Treatment',
    visit: 'Appointment',
    location: 'Practice',
  },
  fields: [],
  features: {
    recall: true,
    reactivation: true,
    reminders: true,
    review_requests: true,
    post_service: true,
    two_way_sms: true,
    phone_logging: true,
    nurture: true,
  },
  workflows: [],
  kpis: [
    { key: 'recall_rate', label: 'Recall Rate', format: 'percent' },
    { key: 'review_avg', label: 'Avg Rating', format: 'number' },
    { key: 'open_rate', label: 'Open Rate', format: 'percent' },
    { key: 'response_rate', label: 'Response Rate', format: 'percent' },
  ],
};

export const demoCampaigns: Campaign[] = [
  {
    id: '1', workspace_id: 'demo', industry: 'dental',
    name: '6-Month Recall Campaign', type: 'recall', channel: 'multi', status: 'active',
    audience_filter: { status: 'active', last_visit_before: '2025-03-01' },
    message_template: 'Hi {{name}}, it\'s time for your 6-month checkup with {{provider}}. Call us to schedule!',
    subject: 'Time for your dental checkup!',
    schedule: { type: 'recurring', frequency: 'weekly', day: 'monday', time: '09:00' },
    total_sent: 342, total_opened: 248, total_responded: 89, total_converted: 67,
    created_at: '2025-01-15T10:00:00Z',
  },
  {
    id: '2', workspace_id: 'demo', industry: 'dental',
    name: 'Reactivation — Inactive 12+ Months', type: 'reactivation', channel: 'email', status: 'active',
    audience_filter: { status: 'inactive', last_visit_before: '2024-06-01' },
    message_template: 'We miss you, {{name}}! It\'s been a while since your last visit. We\'d love to see you again.',
    subject: 'We miss you at our practice!',
    schedule: { type: 'recurring', frequency: 'monthly', day: '1', time: '10:00' },
    total_sent: 156, total_opened: 87, total_responded: 23, total_converted: 15,
    created_at: '2025-02-01T10:00:00Z',
  },
  {
    id: '3', workspace_id: 'demo', industry: 'dental',
    name: 'Appointment Reminder (48hr)', type: 'reminder', channel: 'sms', status: 'active',
    audience_filter: {},
    message_template: 'Reminder: {{name}}, you have an appointment on {{date}} at {{time}} with {{provider}}.',
    schedule: { type: 'trigger', event: 'pre_appointment', delay_hours: -48 },
    total_sent: 1240, total_opened: 1180, total_responded: 45, total_converted: 0,
    created_at: '2025-01-01T10:00:00Z',
  },
  {
    id: '4', workspace_id: 'demo', industry: 'dental',
    name: 'Post-Treatment Follow-Up', type: 'post_service', channel: 'sms', status: 'active',
    audience_filter: { service_type: 'major' },
    message_template: 'Hi {{name}}, how are you feeling after your {{service}}? Let us know if you have any concerns.',
    schedule: { type: 'trigger', event: 'post_appointment', delay_hours: 24 },
    total_sent: 89, total_opened: 78, total_responded: 34, total_converted: 0,
    created_at: '2025-03-10T10:00:00Z',
  },
  {
    id: '5', workspace_id: 'demo', industry: 'dental',
    name: 'Google Review Request', type: 'review_request', channel: 'sms', status: 'paused',
    audience_filter: { last_visit_within: '7d', satisfaction: 'high' },
    message_template: 'Thank you for visiting us, {{name}}! We\'d appreciate a quick review: {{review_link}}',
    schedule: { type: 'trigger', event: 'post_appointment', delay_hours: 72 },
    total_sent: 210, total_opened: 185, total_responded: 62, total_converted: 48,
    created_at: '2025-02-20T10:00:00Z',
  },
];

export const demoMessages: CommMessage[] = Array.from({ length: 50 }, (_, i) => ({
  id: `msg-${i + 1}`,
  campaign_id: demoCampaigns[i % 5].id,
  workspace_id: 'demo',
  person_id: `person-${(i % 20) + 1}`,
  person_name: ['Sarah Johnson', 'Mike Chen', 'Lisa Park', 'David Kim', 'Emma Wilson', 'James Brown', 'Maria Garcia', 'Robert Lee', 'Anna Smith', 'Thomas Davis', 'Jennifer Moore', 'William Taylor', 'Sofia Martinez', 'Daniel Anderson', 'Olivia Thomas', 'Christopher Jackson', 'Isabella White', 'Matthew Harris', 'Mia Martin', 'Andrew Thompson'][i % 20],
  channel: ['sms', 'email', 'sms', 'email', 'sms'][i % 5],
  direction: i % 7 === 0 ? 'inbound' : 'outbound',
  content: i % 7 === 0
    ? 'Yes, I\'d like to schedule an appointment please.'
    : `Hi ${['Sarah', 'Mike', 'Lisa', 'David', 'Emma'][i % 5]}, ${['it\'s time for your checkup!', 'we miss you!', 'reminder about your appointment', 'how are you feeling?', 'we\'d love a review!'][i % 5]}`,
  status: ['sent', 'delivered', 'opened', 'replied', 'sent', 'delivered', 'opened'][i % 7],
  sent_at: new Date(2025, 2, 1 + (i % 28), 9 + (i % 8)).toISOString(),
  opened_at: i % 3 === 0 ? new Date(2025, 2, 1 + (i % 28), 10 + (i % 5)).toISOString() : undefined,
  replied_at: i % 7 === 0 ? new Date(2025, 2, 1 + (i % 28), 11).toISOString() : undefined,
  created_at: new Date(2025, 2, 1 + (i % 28), 9 + (i % 8)).toISOString(),
}));

export const demoTemplates: CommTemplate[] = [
  { id: 't1', workspace_id: 'demo', name: '6-Month Recall — Email', category: 'recall', channel: 'email', subject: 'Time for your dental checkup!', body: 'Dear {{name}},\n\nIt\'s been 6 months since your last visit with {{provider}}. Regular checkups are important for maintaining your oral health.\n\nCall us at {{phone}} or visit {{booking_link}} to schedule.\n\nBest regards,\n{{location}}', is_active: true, created_at: '2025-01-01T10:00:00Z' },
  { id: 't2', workspace_id: 'demo', name: '6-Month Recall — SMS', category: 'recall', channel: 'sms', body: 'Hi {{name}}! Time for your 6-month checkup at {{location}}. Book online: {{booking_link}} or call {{phone}}', is_active: true, created_at: '2025-01-01T10:00:00Z' },
  { id: 't3', workspace_id: 'demo', name: 'Appointment Reminder — 48hr', category: 'reminder', channel: 'sms', body: 'Reminder: {{name}}, you have a {{service}} appointment on {{date}} at {{time}} with {{provider}}. Reply C to confirm.', is_active: true, created_at: '2025-01-01T10:00:00Z' },
  { id: 't4', workspace_id: 'demo', name: 'Post-Treatment Check-In', category: 'post_service', channel: 'sms', body: 'Hi {{name}}, how are you feeling after your {{service}} yesterday? Any pain or concerns? Reply and we\'ll get back to you ASAP.', is_active: true, created_at: '2025-01-01T10:00:00Z' },
  { id: 't5', workspace_id: 'demo', name: 'Review Request', category: 'review_request', channel: 'sms', body: 'Hi {{name}}, thank you for visiting {{location}}! If you had a great experience, we\'d love a quick Google review: {{review_link}}', is_active: true, created_at: '2025-01-01T10:00:00Z' },
  { id: 't6', workspace_id: 'demo', name: 'Reactivation — Email', category: 'reactivation', channel: 'email', subject: 'We miss you!', body: 'Dear {{name}},\n\nIt\'s been a while since we\'ve seen you. Your dental health matters to us!\n\nAs a special welcome back, we\'re offering {{offer}} for returning patients.\n\nSchedule today: {{booking_link}}', is_active: true, created_at: '2025-01-01T10:00:00Z' },
  { id: 't7', workspace_id: 'demo', name: 'Reactivation — SMS', category: 'reactivation', channel: 'sms', body: 'Hi {{name}}, we miss you at {{location}}! Book your comeback visit & get {{offer}}: {{booking_link}}', is_active: true, created_at: '2025-01-01T10:00:00Z' },
  { id: 't8', workspace_id: 'demo', name: 'Birthday Greeting', category: 'nurture', channel: 'sms', body: 'Happy Birthday, {{name}}! 🎂 From all of us at {{location}}. Enjoy a special {{offer}} this month!', is_active: true, created_at: '2025-01-01T10:00:00Z' },
];

export const demoReviews: ReviewTracking[] = [
  { id: 'r1', workspace_id: 'demo', person_id: 'person-1', person_name: 'Sarah Johnson', platform: 'google', requested_at: '2025-03-01T10:00:00Z', completed_at: '2025-03-02T14:30:00Z', rating: 5, review_text: 'Amazing experience! Dr. Smith is incredibly gentle and thorough.', status: 'responded', response_text: 'Thank you Sarah! We\'re glad you had a great experience.', responded_at: '2025-03-02T16:00:00Z', created_at: '2025-03-01T10:00:00Z' },
  { id: 'r2', workspace_id: 'demo', person_id: 'person-2', person_name: 'Mike Chen', platform: 'google', requested_at: '2025-03-05T10:00:00Z', completed_at: '2025-03-06T09:15:00Z', rating: 4, review_text: 'Great service, short wait time. Would recommend.', status: 'completed', created_at: '2025-03-05T10:00:00Z' },
  { id: 'r3', workspace_id: 'demo', person_id: 'person-3', person_name: 'Lisa Park', platform: 'yelp', requested_at: '2025-03-08T10:00:00Z', completed_at: '2025-03-10T11:00:00Z', rating: 5, review_text: 'Best dental office in town! Clean, modern, and friendly staff.', status: 'responded', response_text: 'Thank you Lisa for the kind words!', responded_at: '2025-03-10T14:00:00Z', created_at: '2025-03-08T10:00:00Z' },
  { id: 'r4', workspace_id: 'demo', person_id: 'person-4', person_name: 'David Kim', platform: 'google', requested_at: '2025-03-12T10:00:00Z', status: 'requested', created_at: '2025-03-12T10:00:00Z' },
  { id: 'r5', workspace_id: 'demo', person_id: 'person-5', person_name: 'Emma Wilson', platform: 'google', requested_at: '2025-03-14T10:00:00Z', completed_at: '2025-03-15T08:45:00Z', rating: 5, review_text: 'Wonderful experience from start to finish!', status: 'completed', created_at: '2025-03-14T10:00:00Z' },
  { id: 'r6', workspace_id: 'demo', person_id: 'person-6', person_name: 'James Brown', platform: 'facebook', requested_at: '2025-03-16T10:00:00Z', completed_at: '2025-03-17T13:20:00Z', rating: 4, review_text: 'Professional team. Appointment was on time.', status: 'completed', created_at: '2025-03-16T10:00:00Z' },
  { id: 'r7', workspace_id: 'demo', person_id: 'person-7', person_name: 'Maria Garcia', platform: 'google', requested_at: '2025-03-18T10:00:00Z', status: 'requested', created_at: '2025-03-18T10:00:00Z' },
  { id: 'r8', workspace_id: 'demo', person_id: 'person-8', person_name: 'Robert Lee', platform: 'healthgrades', requested_at: '2025-03-20T10:00:00Z', completed_at: '2025-03-21T10:10:00Z', rating: 5, review_text: 'Dr. Smith explained everything clearly. Very reassuring.', status: 'responded', response_text: 'Thanks Robert, we appreciate your feedback!', responded_at: '2025-03-21T12:00:00Z', created_at: '2025-03-20T10:00:00Z' },
  { id: 'r9', workspace_id: 'demo', person_id: 'person-9', person_name: 'Anna Smith', platform: 'google', requested_at: '2025-03-22T10:00:00Z', completed_at: '2025-03-23T15:00:00Z', rating: 3, review_text: 'Good service but the wait was a bit long.', status: 'completed', created_at: '2025-03-22T10:00:00Z' },
  { id: 'r10', workspace_id: 'demo', person_id: 'person-10', person_name: 'Thomas Davis', platform: 'google', requested_at: '2025-03-25T10:00:00Z', status: 'requested', created_at: '2025-03-25T10:00:00Z' },
];
