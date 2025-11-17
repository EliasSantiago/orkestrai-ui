/**
 * Custom Authentication Service
 * Handles authentication with external API
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirm: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
}

export class CustomAuthService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    // Check both client-side and server-side env vars
    const envUrl =
      typeof window !== 'undefined'
        ? process.env.NEXT_PUBLIC_CUSTOM_API_BASE_URL
        : process.env.NEXT_PUBLIC_CUSTOM_API_BASE_URL;

    // During build time (SSG/SSR), allow empty baseUrl
    // Will only throw error when actually trying to use the service
    if (!baseUrl && !envUrl) {
      // If we're in build mode (no window and no actual request), use placeholder
      if (typeof window === 'undefined') {
        this.baseUrl = 'http://placeholder-for-build.local';
        console.warn('⚠️  CustomAuthService: NEXT_PUBLIC_CUSTOM_API_BASE_URL not set during build. Using placeholder.');
        return;
      }

      throw new Error(
        'NEXT_PUBLIC_CUSTOM_API_BASE_URL is not configured! Please set it in your .env file.'
      );
    }

    this.baseUrl = baseUrl || envUrl!;
  }

  /**
   * Validate that baseUrl is properly configured (not a placeholder)
   */
  private validateBaseUrl(): void {
    if (this.baseUrl === 'http://placeholder-for-build.local') {
      throw new Error(
        'NEXT_PUBLIC_CUSTOM_API_BASE_URL is not configured! Please set it in your .env file.'
      );
    }
  }

  /**
   * Build full URL for an endpoint.
   * Base URL already includes /api, so endpoints should NOT include /api prefix.
   * @example buildUrl('auth/login') -> 'http://backend:8001/api/auth/login'
   */
  private buildUrl(endpoint: string): string {
    const base = this.baseUrl.replace(/\/+$/g, '');
    const path = endpoint.replace(/^\/+/g, '');
    return `${base}/${path}`;
  }

  /**
   * Get stored access token from localStorage
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('custom_auth_token');
  }

  /**
   * Store access token in localStorage
   */
  setAccessToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('custom_auth_token', token);
  }

  /**
   * Remove access token from localStorage
   */
  clearAccessToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('custom_auth_token');
  }

  /**
   * Get stored user info from localStorage
   */
  getUser(): UserResponse | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('custom_auth_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Store user info in localStorage
   */
  setUser(user: UserResponse): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('custom_auth_user', JSON.stringify(user));
  }

  /**
   * Clear user info from localStorage
   */
  clearUser(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('custom_auth_user');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    this.validateBaseUrl();
    const response = await fetch(this.buildUrl('auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail?.[0]?.msg || error.message || 'Login failed');
    }

    const data: TokenResponse = await response.json();
    this.setAccessToken(data.access_token);

    // Fetch user info after login
    try {
      const user = await this.getCurrentUser();
      if (user) {
        this.setUser(user);
      }
    } catch (error) {
      console.warn('Failed to fetch user info after login:', error);
    }

    return data;
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<UserResponse> {
    this.validateBaseUrl();
    const response = await fetch(this.buildUrl('auth/register'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(error.detail?.[0]?.msg || error.message || 'Registration failed');
    }

    const user: UserResponse = await response.json();
    return user;
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<UserResponse | null> {
    this.validateBaseUrl();
    const token = this.getAccessToken();
    if (!token) return null;

    const response = await fetch(this.buildUrl('auth/me'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token is invalid, clear it
        this.clearAccessToken();
        this.clearUser();
      }
      return null;
    }

    const user: UserResponse = await response.json();
    this.setUser(user);
    return user;
  }

  /**
   * Logout - clear all stored data
   */
  logout(): void {
    this.clearAccessToken();
    this.clearUser();
  }

  /**
   * Make authenticated API request
   */
  async authenticatedFetch(
    endpoint: string,
    options: globalThis.RequestInit = {},
  ): Promise<Response> {
    this.validateBaseUrl();
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${token}`);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    return fetch(this.buildUrl(endpoint), {
      ...options,
      headers,
    });
  }
}

// Export singleton instance
export const customAuthService = new CustomAuthService();

