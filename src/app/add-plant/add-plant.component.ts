import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { HttpClient } from '@angular/common/http';

import {
  debounceTime,
  map,
  Observable,
  startWith,
  switchMap,
  catchError,
  of,
} from 'rxjs';

interface Plant {
  name: string;
  quantity: number;
}

interface PlantIdEntity {
  entity_name: string;
  matched_in: string;
}

interface PlantIdResponse {
  entities: PlantIdEntity[];
  matched_in: string;
}

@Component({
  selector: 'app-add-plant',
  templateUrl: './add-plant.component.html',
  styleUrls: ['./add-plant.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AddPlantComponent implements OnInit {
  plantSearch = new FormControl('');
  plants = new FormControl('');

  // Array to store selected plants
  selectedPlants: Plant[] = [];
  // Observable for filtered options
  filteredOptions!: Observable<string[]>;

  // Backend URL for Plant.id API
  plantIdApiUrl = 'http://localhost:3000/api/plants';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Initialize filteredOptions by listening to valueChanges and performing API calls
    this.filteredOptions = this.plantSearch.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap((value) => this.searchPlants(value || ''))
    );
  }

  // Fetch plants from Plant.id API via the Express server
  searchPlants(query: string): Observable<string[]> {
    if (!query) {
      // Return an empty array if query is empty
      return of([]);
    }

    const url = `${this.plantIdApiUrl}?query=${encodeURIComponent(query)}`;

    return this.http.get<PlantIdResponse>(url).pipe(
      // Map the response entities to formatted strings
      map((response) =>
        response.entities.map(
          (entity: PlantIdEntity) =>
            `${entity.entity_name} - ${entity.matched_in}`
        )
      ),
      // Handle errors by logging and returning an empty array
      catchError(() => {
        console.error('API call failed');
        return of([]);
      })
    );
  }

  // Get the quantity of a specific plant by name
  getQuantity(plantName: string): number {
    const plant = this.selectedPlants.find((p) => p.name === plantName);
    return plant ? plant.quantity : 0;
  }

  // Adjust the quantity of a plant in the selectedPlants array
  adjustQuantity(plantName: string, delta: number): void {
    const plant = this.selectedPlants.find((p) => p.name === plantName);
    if (plant) {
      const newQuantity = plant.quantity + delta;
      if (newQuantity > 0) {
        // Update the plant's quantity
        plant.quantity = newQuantity;
      }
    }
  }

  // Handle selection of a plant from the autocomplete dropdown
  onPlantSelected(event: MatAutocompleteSelectedEvent): void {
    const [plantName] = event.option.value.split(' - ');
    // Extract only the entity_name part
    if (!this.selectedPlants.some((plant) => plant.name === plantName)) {
      // Add the plant to selectedPlants if it isn't already present
      this.selectedPlants.push({ name: plantName, quantity: 1 });
    }
    // Clear the search field after selection
    this.plantSearch.setValue('');
  }

  // Clear all selected plants
  clearSelections(): void {
    this.selectedPlants = [];
  }

  // Log selected plants and their quantities
  addPlant(): void {
    console.log('Selected Plants with Quantity:', this.selectedPlants);
  }
}
