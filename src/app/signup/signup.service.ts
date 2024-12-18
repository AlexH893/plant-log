import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment'; // Generic import

@Injectable({
  providedIn: 'root',
})
export class SignupService {
  private apiUrl = `${environment.apiUrl}/signup`;

  constructor(private http: HttpClient) {}

  signup(username: string, password: string): Observable<any> {
    return this.http.post(this.apiUrl, { username, password });
  }
}
