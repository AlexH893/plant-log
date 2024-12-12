import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/login`;

  constructor(private http: HttpClient) {}

  // Check if the user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token); // Check if token exists and is not expired
  }

  // Login method: authenticates the user and stores the authentication token
  login(username: string, password: string): Observable<any> {
    const loginData = { username, password };
    return this.http.post<any>(this.apiUrl, loginData);
  }

  // Logout method: clears the authentication data
  logout(): void {
    localStorage.removeItem('authToken');
  }

  // Save the token in local storage
  setToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  // Retrieve the token from local storage
  getToken(): string | null {
    
    return localStorage.getItem('authToken');
  }

  // Extract user information from the token
  getUserInfo(): { id: string; username: string } | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { id: payload.id, username: payload.username }; // Customize based on token structure
    } catch (e) {
      return null;
    }
  }

  // Utility to check if the token is expired
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (e) {
      return true;
    }
  }
}
