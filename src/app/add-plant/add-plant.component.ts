import { ModalService } from './../modal.service';
import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { HttpClient } from '@angular/common/http';
import { CollectionService } from '../collection.service';
import { PlantService } from '../plant.service'; // Import the PlantService
import { environment } from 'src/environments/environment'; // Generic import
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'; // Import MatDialogRef

import {
  debounceTime,
  map,
  Observable,
  startWith,
  switchMap,
  catchError,
  of,
} from 'rxjs';
import { ActivatedRoute } from '@angular/router';

interface Plant {
  scientific_name: string;
  water: string;
  fertilize: string;
  last_watered: string;
  last_fertilized: string;
  watered: boolean;
  fertilized: boolean;
  quantity: number;
  common_name: string;
  collectionId?: number;
  id: number;
  times_watered?: number;
  times_fertilized?: number;
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
  closeModal() {
    this.dialogRef.close();
  }
  collectionId: number;
  nextPlantId: number = 1;
  collection: any;

  addCustomPlant(): void {
    const customInput = (this.customPlantInput.value || '').trim();

    // Prevent adding empty or duplicate plants
    if (!customInput) {
      this.showToast('Please enter a plant name.');
      return;
    }

    if (
      this.selectedPlants.some(
        (plant) =>
          plant.scientific_name.toLowerCase() === customInput.toLowerCase()
      )
    ) {
      this.showToast('This plant is already selected.');
      this.customPlantInput.setValue(''); // Clear input
      return;
    }

    // Add the custom plant
    this.selectedPlants.push({
      scientific_name: customInput,
      common_name: customInput, // Use the same value for both if no distinction
      quantity: 1,
      water: 'Water',
      fertilize: 'Fertilize',
      last_watered: 'Today', // Default value
      last_fertilized: 'Today', // Default value
      watered: false,
      fertilized: false,

      id: this.nextPlantId++, // Generate a new ID
    });

    // Clear the input field
    this.customPlantInput.setValue('');
    this.showToast('Custom plant added.');
  }
  plantSearch = new FormControl('');
  plants = new FormControl('');

  // Array to store selected plants
  selectedPlants: Plant[] = [];
  // Observable for filtered options
  filteredOptions!: Observable<string[]>;

  // Backend URL for Plant.id API
  plantIdApiUrl = 'http://localhost:3000/api/plants';
  customPlantInput = new FormControl('');

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { collectionId: number },
    private route: ActivatedRoute,

    private http: HttpClient,
    private collectionService: CollectionService,
    private plantService: PlantService,
    private modalService: ModalService,
    private dialogRef: MatDialogRef<AddPlantComponent>
  ) {
    this.collectionId = data.collectionId;
  }

  ngOnInit() {
    this.loadCollection();
    // Initialize filteredOptions
    this.filteredOptions = this.plantSearch.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap((value) => this.searchPlants(value || ''))
    );
    console.log('Collection ID:', this.collectionId);

    // this.route.paramMap.subscribe((params) => {
    //   const id = params.get('id');
    //   if (id) {
    //     this.collectionId = +id;
    //     this.getCollectionDetails();
    //     console.log('Collection ID:', this.collectionId);
    //   } else {
    //     console.error('Collection ID is missing');
    //   }

    //   // Only check after collectionId is set:
    //   if (!this.collectionId && !this.data.collectionId) {
    //     alert('Error: Collection ID is missing. Please try again.');
    //   }
    // });

    console.log('Collection ID in Add Plant Modal:', this.data.collectionId);
  }

  loadCollection() {
    if (!this.collectionId) {
      console.error('No collection ID provided.');
      return;
    }

    this.collectionService.getCollectionById(this.collectionId).subscribe(
      (data) => {
        this.collection = data;
        console.log('Collection loaded:', this.collection);
      },
      (error) => {
        console.error('Error loading collection:', error);
      }
    );
  }

  // Fetch plants from Plant.id API via the Express server
  searchPlants(query: string): Observable<string[]> {
    if (!query) {
      return of([]);
    }

    const url = `${this.plantIdApiUrl}?query=${encodeURIComponent(query)}`;

    return this.http.get<PlantIdResponse>(url).pipe(
      map((response) =>
        response.entities.map(
          (entity: PlantIdEntity) =>
            `${entity.entity_name} - ${entity.matched_in}`
        )
      ),
      catchError(() => {
        console.error('API call failed');
        return of([]);
      })
    );
  }

  // Adjust the quantity of a plant in the selectedPlants array

  adjustQuantity(plantName: string, delta: number): void {
    const plant = this.selectedPlants.find(
      (p) => p.scientific_name === plantName
    );
    if (plant) {
      const newQuantity = plant.quantity + delta;
      if (newQuantity > 0) {
        plant.quantity = newQuantity;
      }
    }
  }

  // Get collection details
  getCollectionDetails() {
    if (!this.collectionId) {
      console.error('No collection ID provided');
      return;
    }

    this.http
      .get<any>(`${environment.apiUrl}/collection/${this.collectionId}`)
      .subscribe(
        (data) => {
          this.collection = data;
        },
        (error) => {
          console.error('Error fetching collection details:', error);
        }
      );
  }

  // Handle selection of a plant from the autocomplete dropdown
  onPlantSelected(event: MatAutocompleteSelectedEvent): void {
    const [scientific_name, common_name] = event.option.value.split(' - ');
    console.log(scientific_name + ' !');
    console.log(common_name + ' !');

    if (
      !this.selectedPlants.some(
        (plant) => plant.scientific_name === scientific_name
      )
    ) {
      this.selectedPlants.push({
        scientific_name: scientific_name,
        common_name: common_name,
        quantity: 1,
        water: 'Water',
        fertilize: 'Fertilize',
        last_watered: 'Today',
        last_fertilized: 'Today',
        watered: false,
        fertilized: false,
        id: this.nextPlantId++,
      });
    }

    this.plantSearch.setValue('');
  }

  // Clear all selected plants
  clearSelections(): void {
    this.selectedPlants = [];
  }

  // Log selected plants and their quantities
  addPlants(collectionId: number) {
    if (this.selectedPlants.length === 0) {
      this.showToast('Please select plants to add.');
      return;
    }

    const plantsToAdd = this.selectedPlants.map((plant) => ({
      scientific_name: plant.scientific_name,
      common_name: plant.common_name,
      quantity: plant.quantity,
      last_watered: plant.last_watered || null,
      last_fertilized: plant.last_fertilized || null,
    }));

    this.collectionService
      .addPlantsToCollection(collectionId, plantsToAdd)
      .subscribe(
        (response) => {
          console.log('Plants added to collection', response);
          this.selectedPlants = [];
          // PlantService.getCollectionPlants();
          this.showToast('Plants added successfully.');
        },
        (error) => {
          console.error('Error adding plants to collection:', error);
          this.showToast('Error adding plants to collection.');
        }
      );
  }

  showToast(message: string | null) {
    const toast = document.getElementById('toast');

    if (!toast) {
      console.warn('Toast element not found.');
      return;
    }

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}
