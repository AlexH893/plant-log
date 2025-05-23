import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Plant } from 'src/plant.model';
@Injectable({
  providedIn: 'root',
})
export class PlantService {
  private apiUrl = 'http://localhost:3000/api/plants';
  private plantCountUrl = `${environment.plantCountUrl}`;
  constructor(private http: HttpClient) {}
  collection: any;
  collectionId?: number;

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

  getTotalPlants(userId: number): Observable<{ total_plants: number }> {
    return this.http.get<{ total_plants: number }>(
      `${this.plantCountUrl}/${userId}`
    );
  }

  getCollectionPlants(collectionId: string) {
    const url = `${environment.apiUrl}/collection/${collectionId}/plants`;

    return this.http.get<{ success: boolean; plants: Plant[] }>(url);
  }
}
