import type { TestCase, Bug, DashboardStats } from '@/types';

// Available QA testers for assignment
export const qaTesters = [
  { id: 'qa1', name: 'Mike Chen' },
  { id: 'qa2', name: 'Lisa Wang' },
  { id: 'qa3', name: 'James Park' },
];

export const mockTests: TestCase[] = [
  {
    id: '1',
    module_platform: 'Authentication',
    test_case: 'User login with valid credentials',
    expected_result: 'User should be redirected to dashboard after successful login with session created',
    status: 'pass',
    assigned_to: 'Mike Chen',
    created_by: 'Sarah Johnson',
    evidence_url: 'https://jam.dev/c/abc123',
    notes: 'Working as expected across all browsers',
    created_at: '2024-01-08T10:00:00Z',
    updated_at: '2024-01-09T14:30:00Z',
  },
  {
    id: '2',
    module_platform: 'Authentication',
    test_case: 'Password reset flow via email',
    expected_result: 'User receives reset email within 2 minutes and can set new password',
    status: 'fail',
    assigned_to: 'Mike Chen',
    created_by: 'Sarah Johnson',
    evidence_url: 'https://jam.dev/c/def456',
    notes: 'Email not being sent in staging environment',
    created_at: '2024-01-08T11:00:00Z',
    updated_at: '2024-01-09T16:00:00Z',
  },
  {
    id: '3',
    module_platform: 'Dashboard',
    test_case: 'Dashboard data loading performance',
    expected_result: 'Dashboard should load completely within 3 seconds with accurate statistics',
    status: 'pending',
    assigned_to: 'Mike Chen',
    created_by: 'Sarah Johnson',
    evidence_url: null,
    notes: 'Currently testing performance metrics',
    created_at: '2024-01-09T09:00:00Z',
    updated_at: '2024-01-09T09:00:00Z',
  },
  {
    id: '4',
    module_platform: 'File Management',
    test_case: 'File upload with various formats',
    expected_result: 'System accepts PDF, DOC, PNG, JPG files up to 10MB with progress indicator',
    status: 'pending',
    assigned_to: 'Mike Chen',
    created_by: 'Sarah Johnson',
    evidence_url: null,
    notes: '',
    created_at: '2024-01-09T10:00:00Z',
    updated_at: '2024-01-09T10:00:00Z',
  },
  {
    id: '5',
    module_platform: 'User Profile',
    test_case: 'Update user profile information',
    expected_result: 'Changes to name, email, avatar should persist and reflect immediately',
    status: 'escalated',
    assigned_to: 'Mike Chen',
    created_by: 'Sarah Johnson',
    evidence_url: 'https://jam.dev/c/escalated001',
    notes: 'Escalated due to critical authentication issues discovered',
    created_at: '2024-01-07T15:00:00Z',
    updated_at: '2024-01-09T08:00:00Z',
  },
  {
    id: '6',
    module_platform: 'Search',
    test_case: 'Search with special characters and filters',
    expected_result: 'Search returns accurate results for queries with special chars (!@#$%) and filters work correctly',
    status: 'pass',
    assigned_to: 'Mike Chen',
    created_by: 'Sarah Johnson',
    evidence_url: 'https://jam.dev/c/ghi789',
    notes: 'All search scenarios passing',
    created_at: '2024-01-06T10:00:00Z',
    updated_at: '2024-01-08T12:00:00Z',
  },
];

export const mockBugs: Bug[] = [
  {
    id: '1',
    title: 'Login button unresponsive on mobile',
    description: 'The login button does not respond to taps on iOS Safari',
    severity: 'high',
    status: 'open',
    evidence_url: 'https://jam.dev/c/bug001',
    notes: 'Reproducible on iPhone 14 Pro',
    reported_by: 'Mike Chen',
    assigned_to: 'Alex Rivera',
    created_at: '2024-01-09T08:00:00Z',
    updated_at: '2024-01-09T08:00:00Z',
  },
  {
    id: '2',
    title: 'Data not persisting after refresh',
    description: 'Form data is lost when the page is refreshed',
    severity: 'medium',
    status: 'in_progress',
    evidence_url: 'https://jam.dev/c/bug002',
    notes: 'Investigating localStorage implementation',
    reported_by: 'Mike Chen',
    assigned_to: 'Alex Rivera',
    created_at: '2024-01-08T14:00:00Z',
    updated_at: '2024-01-09T10:00:00Z',
  },
  {
    id: '3',
    title: 'Incorrect date format in reports',
    description: 'Dates show as MM/DD/YYYY instead of the configured DD/MM/YYYY',
    severity: 'low',
    status: 'resolved',
    evidence_url: 'https://jam.dev/c/bug003',
    notes: 'Fixed in v2.1.3',
    reported_by: 'Mike Chen',
    assigned_to: 'Alex Rivera',
    created_at: '2024-01-05T11:00:00Z',
    updated_at: '2024-01-07T16:00:00Z',
  },
];

export const mockStats: DashboardStats = {
  total_tests: 6,
  passed_tests: 2,
  failed_tests: 1,
  pending_tests: 2,
  open_bugs: 3,
};

// Global feed items combining test updates and bugs for Engineering view
export interface FeedItem {
  id: string;
  type: 'test_update' | 'bug_report';
  title: string;
  description: string;
  evidence_url: string | null;
  notes: string;
  status: string;
  author: string;
  timestamp: string;
}

export const mockFeedItems: FeedItem[] = [
  {
    id: '1',
    type: 'test_update',
    title: 'Password reset flow',
    description: 'Test failed - Email not being sent in staging environment',
    evidence_url: 'https://jam.dev/c/def456',
    notes: 'Email not being sent in staging environment. SMTP configuration may need review.',
    status: 'fail',
    author: 'Mike Chen',
    timestamp: '2024-01-09T16:00:00Z',
  },
  {
    id: '2',
    type: 'bug_report',
    title: 'Login button unresponsive on mobile',
    description: 'The login button does not respond to taps on iOS Safari',
    evidence_url: 'https://jam.dev/c/bug001',
    notes: 'Reproducible on iPhone 14 Pro. May be related to touch event handling.',
    status: 'high',
    author: 'Mike Chen',
    timestamp: '2024-01-09T08:00:00Z',
  },
  {
    id: '3',
    type: 'test_update',
    title: 'User login with valid credentials',
    description: 'Test passed - Working as expected',
    evidence_url: 'https://jam.dev/c/abc123',
    notes: 'Working as expected across all browsers. No issues found.',
    status: 'pass',
    author: 'Mike Chen',
    timestamp: '2024-01-09T14:30:00Z',
  },
  {
    id: '4',
    type: 'bug_report',
    title: 'Data not persisting after refresh',
    description: 'Form data is lost when the page is refreshed',
    evidence_url: 'https://jam.dev/c/bug002',
    notes: 'Investigating localStorage implementation. State management may need review.',
    status: 'medium',
    author: 'Mike Chen',
    timestamp: '2024-01-09T10:00:00Z',
  },
];
