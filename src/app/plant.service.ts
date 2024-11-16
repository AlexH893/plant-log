import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PlantService {
  private apiUrl = 'http://localhost:3000/api/plants';

  constructor(private http: HttpClient) {}

  searchPlants(query: string): Observable<any[]> {
    const params = new HttpParams().set('query', query);

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => response || []),
      catchError(() => {
        console.error('Failed to fetch plants from backend');
        return [];
      })
    );
  }
}
