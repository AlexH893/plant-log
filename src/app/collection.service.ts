import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs';

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
    plantId: number,
    scientific_name: string,
    common_name: string,
    quantity: number
  ): Observable<{ id: number }> {
    // Specify the expected response type
    const url = `http://localhost:3000/api/collection/${collectionId}/add-plant`;
    const body = {
      plantId,
      scientific_name,
      common_name,
      quantity,
    };

    return this.http.post<{ id: number }>(url, body);
  }
}
