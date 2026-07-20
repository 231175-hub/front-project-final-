import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiConfiguration } from '../../api/api-configuration';

export interface UserProfile {
  idUser: string;
  email: string;
  fullName: string;
  role: string;
  urlImageProfile?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  user?: UserProfile;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiConfig = inject(ApiConfiguration);

  private readonly TOKEN_KEY = 'auth_access_token';
  private readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';
  private readonly USER_KEY = 'auth_user_profile';

  public currentUser = signal<UserProfile | null>(this.getStoredUser());
  public isLoggedInSignal = signal<boolean>(!!this.getToken());

  constructor() {}

  private get baseUrl(): string {
    let root = this.apiConfig.rootUrl || '';
    if (root.endsWith('/')) {
      root = root.substring(0, root.length - 1);
    }
    return root;
  }

  public login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, { email, password }).pipe(
      tap(res => {
        if (res.success && res.accessToken && res.refreshToken) {
          this.setSession(res.accessToken, res.refreshToken, res.user);
        }
      })
    );
  }

  public refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/refresh`, { refreshToken }).pipe(
      tap(res => {
        if (res.success && res.accessToken && res.refreshToken) {
          this.setSession(res.accessToken, res.refreshToken, this.currentUser() || undefined);
        } else {
          this.logout();
        }
      }),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  public forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/forgot-password`, { email });
  }

  private setSession(accessToken: string, refreshToken: string, user?: UserProfile): void {
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    
    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      this.currentUser.set(user);
    }
    
    this.isLoggedInSignal.set(true);
  }

  public logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    this.currentUser.set(null);
    this.isLoggedInSignal.set(false);
    
    this.router.navigate(['/login']);
  }

  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  public isLoggedIn(): boolean {
    return !!this.getToken();
  }

  public getUserRoles(): string[] {
    const user = this.currentUser() || this.getStoredUser();
    if (!user || !user.role) return [];
    
    const roleUpper = user.role.toUpperCase().trim();
    const roles: string[] = [roleUpper];
    
    if (roleUpper === 'ADMIN' || roleUpper === 'ADMINISTRATOR' || roleUpper === 'ADMINISTRADOR' || roleUpper.includes('ADMIN')) {
      roles.push('ADMIN');
    }
    if (roleUpper === 'PROFESSOR' || roleUpper === 'PROFESOR' || roleUpper === 'DOCENTE' || roleUpper.includes('PROFESOR') || roleUpper.includes('PROFESSOR')) {
      roles.push('PROFESSOR');
    }
    if (roleUpper === 'STUDENT' || roleUpper === 'ESTUDIANTE' || roleUpper === 'ALUMNO' || roleUpper.includes('ESTUDIANTE') || roleUpper.includes('STUDENT')) {
      roles.push('STUDENT');
    }
    
    return roles;
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser() || this.getStoredUser();
  }

  public getStoredUser(): UserProfile | null {
    const stored = localStorage.getItem(this.USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  public updateStoredUser(user: UserProfile): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  public loadUserProfile(): Promise<any> {
    const user = this.getCurrentUser();
    if (user) {
      return Promise.resolve({
        id: user.idUser,
        username: user.email,
        email: user.email,
        firstName: user.fullName ? user.fullName.split(' ')[0] : '',
        lastName: user.fullName && user.fullName.split(' ').length > 1 ? user.fullName.split(' ').slice(1).join(' ') : ''
      });
    }
    return Promise.reject('User not logged in');
  }

  public async updateToken(minValiditySeconds: number = 5): Promise<boolean> {
    return true;
  }
}
