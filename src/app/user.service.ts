import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/user`;
  private userUrl = `${environment.userUrl}`;

  constructor(private http: HttpClient) {}

  // Update fertilizeState
  updateFertilizeState(
    userId: number,
    fertilizeState: number
  ): Observable<any> {
    return this.http.put(`${this.userUrl}/${userId}/fertilize-state`, {
      fertilizeState,
    });
  }

  // Fetch fertilizeState
  getFertilizeState(userId: number): Observable<any> {
    return this.http.get(`${this.userUrl}/${userId}/fertilize-state`);
  }
}
