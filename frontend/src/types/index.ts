export type UserRole = 'PM' | 'QA' | 'ENG';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_verified: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  register?: (data: RegisterData) => Promise<void>;
  forgotPassword?: (email: string) => Promise<void>;
  resetPassword?: (token: string, password: string) => Promise<void>;
  verifyEmail?: (token: string) => Promise<void>;
}

export type TestStatus = 'pending' | 'pass' | 'fail' | 'escalated';
export type BugSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'converted_to_test';

export interface QATester {
  id: string;
  name: string;
  email: string;
}

export interface TestCase {
  id: string;
  module_platform: string;
  test_case: string;
  expected_result: string;
  status: TestStatus;
  assigned_to: string;
  created_by: string;
  evidence_url: string | null;
  notes: string | null;
  source_bug_id: string | null;
  created_at: string;
  updated_at: string;
  assignee?: QATester;
  creator?: QATester;
  source_bug?: {
    id: string;
    module_platform: string;
    created_by: string;
    bug_creator?: QATester;
  };
}

export interface Bug {
  id: string;
  module_platform: string;
  jam_link: string;
  description: string;
  note: string | null;
  severity: BugSeverity;
  status: BugStatus;
  created_by: string;
  converted_to_test_id: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
  creator?: QATester;
}

export interface DashboardStats {
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  pending_tests: number;
  escalated_tests: number;
  open_bugs: number;
  total_bugs: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: Pagination;
  };
}
