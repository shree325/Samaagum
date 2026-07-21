import React from 'react';
import { apiBase } from '../home-subscription';

import { paths } from '../generated/messaging-types';

export class ApiError extends Error {
  constructor(
    public status: number,
    public override message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class MessagingApiClient {
  private apiBase: string;

  constructor() {
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const port = typeof window !== 'undefined' ? window.location.port : '';
    this.apiBase = isLocalhost && port === '8080' ? 'http://localhost:3000' : '';
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    params?: Record<string, string | number | boolean | undefined>,
    signal?: AbortSignal
  ): Promise<T> {
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    let url = `${this.apiBase}${path}`;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.set(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal,
      });

      let responseData: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        throw new ApiError(
          response.status,
          responseData?.error || responseData?.message || `Request failed with status ${response.status}`,
          responseData
        );
      }

      return responseData as T;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw error;
      }
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, error.message || 'Network error occurred', error);
    }
  }

  public searchUsers(
    query: string,
    signal?: AbortSignal
  ): Promise<paths['/api/messaging/users/search']['get']['responses']['200']['content']['application/json']> {
    return this.request('/api/messaging/users/search', { method: 'GET' }, { q: query }, signal);
  }

  public getRequestStatus(
    userId: string
  ): Promise<paths['/api/messaging/requests/status/{userId}']['get']['responses']['200']['content']['application/json']> {
    return this.request(`/api/messaging/requests/status/${encodeURIComponent(userId)}`, { method: 'GET' });
  }

  public getOrCreateDirectConversation(
    body: paths['/api/messaging/conversations/direct']['post']['requestBody']['content']['application/json']
  ): Promise<paths['/api/messaging/conversations/direct']['post']['responses']['200']['content']['application/json']> {
    return this.request('/api/messaging/conversations/direct', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public sendMessageRequest(
    body: paths['/api/messaging/requests']['post']['requestBody']['content']['application/json']
  ): Promise<paths['/api/messaging/requests']['post']['responses']['200']['content']['application/json']> {
    return this.request('/api/messaging/requests', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public getIncomingRequests(): Promise<paths['/api/messaging/requests/incoming']['get']['responses']['200']['content']['application/json']> {
    return this.request('/api/messaging/requests/incoming', { method: 'GET' });
  }

  public acceptRequest(
    reqId: string
  ): Promise<paths['/api/messaging/requests/{reqId}/accept']['post']['responses']['200']['content']['application/json']> {
    return this.request(`/api/messaging/requests/${encodeURIComponent(reqId)}/accept`, { method: 'POST' });
  }

  public declineRequest(
    reqId: string
  ): Promise<paths['/api/messaging/requests/{reqId}/decline']['post']['responses']['200']['content']['application/json']> {
    return this.request(`/api/messaging/requests/${encodeURIComponent(reqId)}/decline`, { method: 'POST' });
  }

  public getConversations(): Promise<paths['/api/messaging/conversations']['get']['responses']['200']['content']['application/json']> {
    return this.request('/api/messaging/conversations', { method: 'GET' });
  }

  public getConversationMessages(
    conversationId: string,
    params?: paths['/api/messaging/conversations/{conversationId}/messages']['get']['parameters']['query']
  ): Promise<paths['/api/messaging/conversations/{conversationId}/messages']['get']['responses']['200']['content']['application/json']> {
    return this.request(
      `/api/messaging/conversations/${encodeURIComponent(conversationId)}/messages`,
      { method: 'GET' },
      params as Record<string, string | number | boolean | undefined>
    );
  }
}

// Bind to window to expose globally to other script tags compiled by Babel Standalone
export const messagingApi = new MessagingApiClient();
(window as any).messagingApi = messagingApi;
