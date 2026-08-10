const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  cached?: boolean;
  cache_source?: string;
  simulation?: { isRunning: boolean };
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('session_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include',
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Request failed with status ${response.status}`);
    }

    return data as ApiResponse<T>;
  } catch (error: any) {
    throw error;
  }
}

export const api = {
  // Auth
  auth: {
    signup: async (data: { email?: string; password?: string; full_name?: string }) => {
      const res = await request('/auth/signup', { method: 'POST', body: JSON.stringify(data) });
      if (typeof window !== 'undefined' && res.data?.session_token) {
        localStorage.setItem('session_token', res.data.session_token);
      }
      return res;
    },
    login: async (data: { email?: string; password?: string }) => {
      const res = await request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
      if (typeof window !== 'undefined' && res.data?.session_token) {
        localStorage.setItem('session_token', res.data.session_token);
      }
      return res;
    },
    logout: async () => {
      try {
        await request('/auth/logout', { method: 'POST' });
      } finally {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('session_token');
        }
      }
    },
    me: () =>
      request('/auth/me', { method: 'GET' }),
  },

  // Users
  users: {
    getProfile: () =>
      request('/users/me', { method: 'GET' }),
    updateProfile: (data: { full_name?: string; bio?: string; avatar_url?: string }) =>
      request('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
    getUserById: (userId: string) =>
      request(`/users/${userId}`, { method: 'GET' }),
  },

  // Groups
  groups: {
    list: (query?: string) =>
      request(`/groups${query ? `?q=${encodeURIComponent(query)}` : ''}`, { method: 'GET' }),
    listPublic: (query?: string) =>
      request(`/groups?public=true${query ? `&q=${encodeURIComponent(query)}` : ''}`, { method: 'GET' }),
    create: (data: { title: string; description?: string; is_public?: boolean }) =>
      request('/groups', { method: 'POST', body: JSON.stringify(data) }),
    getDetails: (groupId: string) =>
      request(`/groups/${groupId}`, { method: 'GET' }),
    update: (groupId: string, data: { title?: string; description?: string; is_public?: boolean }) =>
      request(`/groups/${groupId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (groupId: string) =>
      request(`/groups/${groupId}`, { method: 'DELETE' }),
  },

  // Memberships & Invites
  memberships: {
    listMembers: (groupId: string) =>
      request(`/groups/${groupId}/members`, { method: 'GET' }),
    joinGroup: (groupId: string) =>
      request(`/groups/${groupId}/members`, { method: 'POST' }),
    leaveGroup: (groupId: string, userId: string) =>
      request(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' }),
    updateRole: (groupId: string, userId: string, role: 'admin' | 'member') =>
      request(`/groups/${groupId}/members/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    createInvite: (groupId: string) =>
      request(`/groups/${groupId}/invites`, { method: 'POST' }),
    joinByInvite: (token: string) =>
      request(`/invites/${token}/join`, { method: 'POST' }),
  },

  // Events / Study Sessions
  events: {
    listByGroup: (groupId: string) =>
      request(`/groups/${groupId}/events`, { method: 'GET' }),
    create: (groupId: string, data: { title: string; description?: string; location?: string; start_time: string; end_time?: string }) =>
      request(`/groups/${groupId}/events`, { method: 'POST', body: JSON.stringify(data) }),
    rsvp: (eventId: string) =>
      request(`/events/${eventId}/rsvp`, { method: 'POST' }),
    getMyEvents: () =>
      request('/events/my', { method: 'GET' }),
    delete: (groupId: string, eventId: string) =>
      request(`/groups/${groupId}/events/${eventId}`, { method: 'DELETE' }),
  },

  // Materials / Documents
  materials: {
    listByGroup: (groupId: string, folderId?: string) =>
      request(`/groups/${groupId}/materials${folderId ? `?folder_id=${folderId}` : ''}`, { method: 'GET' }),
    createFolder: (groupId: string, data: { name: string }) =>
      request(`/groups/${groupId}/material-folders`, { method: 'POST', body: JSON.stringify(data) }),
    upload: (groupId: string, data: { title: string; file_format?: string; file_size_bytes?: number; file_url: string; folder_id?: string }) =>
      request(`/groups/${groupId}/materials`, { method: 'POST', body: JSON.stringify(data) }),
    getAllMaterials: () =>
      request('/materials/all', { method: 'GET' }),
    delete: (groupId: string, materialId: string) =>
      request(`/groups/${groupId}/materials/${materialId}`, { method: 'DELETE' }),
  },

  // Messages & Direct Messaging
  messages: {
    getGroupMessages: (groupId: string, conversationId?: string) =>
      request(`/groups/${groupId}/messages${conversationId ? `?conversation_id=${conversationId}` : ''}`, { method: 'GET' }),
    sendGroupMessage: (groupId: string, data: { content: string; conversation_id?: string }) =>
      request(`/groups/${groupId}/messages`, { method: 'POST', body: JSON.stringify(data) }),
    getConversations: (groupId: string) =>
      request(`/groups/${groupId}/conversations`, { method: 'GET' }),
    createConversation: (groupId: string, data: { title: string }) =>
      request(`/groups/${groupId}/conversations`, { method: 'POST', body: JSON.stringify(data) }),
    deleteConversation: (groupId: string, conversationId: string) =>
      request(`/groups/${groupId}/conversations/${conversationId}`, { method: 'DELETE' }),
    sendChatRequest: (data: { messaging_code: string }) =>
      request('/direct-chats/request', { method: 'POST', body: JSON.stringify(data) }),
    getDirectChats: () =>
      request('/direct-chats', { method: 'GET' }),
    respondToRequest: (requestId: string, action: 'accept' | 'decline') =>
      request(`/direct-chats/request/${requestId}`, { method: 'PATCH', body: JSON.stringify({ action }) }),
    getDirectMessages: (partnerId: string) =>
      request(`/direct-messages/${partnerId}`, { method: 'GET' }),
    sendDirectMessage: (partnerId: string, data: { content: string }) =>
      request(`/direct-messages/${partnerId}`, { method: 'POST', body: JSON.stringify(data) }),
  },

  // Community Reports
  reports: {
    submit: (data: { target_type: 'user' | 'group' | 'message' | 'material' | 'event'; target_id: string; reason: string; details?: string }) =>
      request('/reports', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Operational Admin Telemetry
  admin: {
    getMetrics: () =>
      request('/admin/metrics', { method: 'GET' }),
    startSimulation: () =>
      request('/admin/simulation/start', { method: 'POST' }),
    stopSimulation: () =>
      request('/admin/simulation/stop', { method: 'POST' }),
    resetMetrics: () =>
      request('/admin/metrics/reset', { method: 'POST' }),
  },
};
