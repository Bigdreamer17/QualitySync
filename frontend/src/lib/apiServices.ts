import api from './api';
import type {
  TestCase,
  Bug,
  DashboardStats,
  QATester,
  Pagination,
  TestStatus,
  BugSeverity,
} from '@/types';

// Response types
interface TestsResponse {
  success: boolean;
  data: {
    tests: TestCase[];
    pagination: Pagination;
  };
}

interface BugsResponse {
  success: boolean;
  data: {
    bugs: Bug[];
    pagination: Pagination;
  };
}

interface StatsResponse {
  success: boolean;
  data: {
    stats: DashboardStats;
  };
}

interface TestersResponse {
  success: boolean;
  data: {
    testers: QATester[];
  };
}

interface TestResponse {
  success: boolean;
  data: {
    test: TestCase;
  };
}

interface BugResponse {
  success: boolean;
  data: {
    bug: Bug;
  };
}

// Test API
export const testApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: TestStatus;
    module_platform?: string;
    search?: string;
  }) => {
    const response = await api.get<TestsResponse>('/tests', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<TestResponse>(`/tests/${id}`);
    return response.data;
  },

  create: async (data: {
    module_platform: string;
    test_case: string;
    expected_result: string;
    evidence_url?: string;
    assigned_to: string;
  }) => {
    const response = await api.post<TestResponse>('/tests', data);
    return response.data;
  },

  update: async (
    id: string,
    data: {
      module_platform?: string;
      test_case?: string;
      expected_result?: string;
      evidence_url?: string;
      assigned_to?: string;
    }
  ) => {
    const response = await api.put<TestResponse>(`/tests/${id}`, data);
    return response.data;
  },

  updateResult: async (
    id: string,
    data: {
      status: 'pass' | 'fail' | 'escalated';
      evidence_url?: string;
      notes?: string;
    }
  ) => {
    const response = await api.put<TestResponse>(`/tests/${id}/result`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/tests/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<StatsResponse>('/tests/stats');
    return response.data;
  },
};

// Bug API
export const bugApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    severity?: BugSeverity;
    module_platform?: string;
    search?: string;
  }) => {
    const response = await api.get<BugsResponse>('/bugs', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<BugResponse>(`/bugs/${id}`);
    return response.data;
  },

  create: async (data: {
    module_platform: string;
    jam_link: string;
    description: string;
    note?: string;
    severity?: BugSeverity;
  }) => {
    const response = await api.post<BugResponse>('/bugs', data);
    return response.data;
  },

  update: async (
    id: string,
    data: {
      module_platform?: string;
      jam_link?: string;
      description?: string;
      note?: string;
      severity?: BugSeverity;
      status?: string;
    }
  ) => {
    const response = await api.put<BugResponse>(`/bugs/${id}`, data);
    return response.data;
  },

  convertToTest: async (
    id: string,
    data: {
      assigned_to: string;
      test_case: string;
      expected_result: string;
    }
  ) => {
    const response = await api.post<TestResponse>(`/bugs/${id}/convert`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/bugs/${id}`);
    return response.data;
  },
};

// User types
import type { UserRole } from '@/types';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_verified: boolean;
  created_at: string;
}

interface UsersResponse {
  success: boolean;
  data: {
    users: UserData[];
    pagination: Pagination;
  };
}

interface UserResponse {
  success: boolean;
  data: {
    user: UserData;
  };
  message?: string;
}

// User API
export const userApi = {
  getQATesters: async () => {
    const response = await api.get<TestersResponse>('/users/qa-testers');
    return response.data;
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }) => {
    const response = await api.get<UsersResponse>('/users', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<UserResponse>(`/users/${id}`);
    return response.data;
  },

  create: async (data: {
    email: string;
    name: string;
    role: string;
    password?: string;
  }) => {
    const response = await api.post<UserResponse>('/users', data);
    return response.data;
  },

  update: async (
    id: string,
    data: {
      name?: string;
      role?: string;
    }
  ) => {
    const response = await api.put<UserResponse>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
