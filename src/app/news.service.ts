import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment'; // Generic import

@Injectable({
  providedIn: 'root',
})
export class NewsService {
  constructor(private http: HttpClient) {}

  // Mark news as read by updating the user's read_news column
  markAsRead(userId: number): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/read-news`, { userId });
  }

  // Fetch the news read status for a given user ID
  getNewUpdates(userId: number): Observable<any> {
    const url = `${environment.apiUrl}/check-new-updates/${userId}`;

    return this.http.get<any>(url);
  }
}
