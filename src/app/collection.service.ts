import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment'; // Generic import

@Injectable({
  providedIn: 'root',
})
export class CollectionService {
  constructor(private http: HttpClient) {}

  private refreshCollection = new Subject<void>();
  refreshCollection$ = this.refreshCollection.asObservable();

  triggerRefreshCollection() {
    this.refreshCollection.next();
  }

  addPlantToCollection(
    collectionId: number,
    plants: { scientific_name: string; common_name: string; quantity: number }[]
  ): Observable<any> {
    const url = `${environment.apiUrl}/collection/${collectionId}/plants`;
    return this.http.post(url, { plants });
  }

  addPlantsToCollection(
    collectionId: number,
    plants: {
      scientific_name: string;
      common_name: string;
      quantity: number;
      last_watered: string | null;
    }[]
  ): Observable<any> {
    const url = `${environment.apiUrl}/collection/${collectionId}/plants/add`;
    return this.http.post(url, { plants }).pipe(
      catchError((error) => {
        console.error('Error adding plants:', error);
        return throwError(
          () => new Error('Error adding plants to collection.')
        );
      })
    );
  }

  getCollectionById(collectionId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/collection/${collectionId}`);
  }
}
