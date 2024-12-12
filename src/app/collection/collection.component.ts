import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { CollectionService } from '../collection.service';
import { Router } from '@angular/router';
import { NewsComponent } from '../news/news.component';
import { ModalService } from '../modal.service';
import {
  debounceTime,
  map,
  Observable,
  startWith,
  switchMap,
  catchError,
  of,
} from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { EditPlantComponent } from '../edit-plant/edit-plant.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'src/environments/environment.prod';

interface Plant {
  scientific_name: string;
  water: string;
  last_watered: string;
  watered: boolean;
  quantity: number;
  common_name: string;
  collectionId?: number;
  id: number;
}

const ELEMENT_DATA: Plant[] = [];

interface PlantIdEntity {
  entity_name: string;
  matched_in: string;
}

interface PlantIdResponse {
  entities: PlantIdEntity[];
  matched_in: string;
}

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CollectionComponent implements OnInit {
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
      last_watered: 'Today', // Default value
      watered: false,
      id: this.nextPlantId++, // Generate a new ID
    });

    // Clear the input field
    this.customPlantInput.setValue('');
    this.showToast('Custom plant added.');
  }

  home() {
    this.router.navigate(['/home']);
  }
  logout() {
    // Clear the token from localStorage
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  displayedColumns: string[] = ['name', 'last_watered', 'water', 'actions'];
  dataSource = new MatTableDataSource<Plant>(ELEMENT_DATA);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  plantCount: number = 0;
  collection: any;
  collectionId: number;
  nextPlantId: number = 1;

  plantSearch = new FormControl('');
  customPlantInput = new FormControl('');
  plants = new FormControl('');

  selectedPlants: Plant[] = [];
  filteredOptions!: Observable<string[]>;
  selectedPlant: any;
  plantIdApiUrl = `${environment.apiUrl}/plants`;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private collectionService: CollectionService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private modalService: ModalService
  ) {
    this.collectionId = 1;
  }

  // Water plant - send current timestamp
  waterPlant(plant: Plant): void {
    console.log('Collection ID:', this.collectionId);
    console.log('Plant ID:', plant.id);

    if (!this.collectionId || !plant.id) {
      console.error('Plant or Collection ID is undefined');
      return;
    }

    const url = `${environment.apiUrl}/collection/${this.collectionId}/plant/${plant.id}`;

    this.http.put(url, {}).subscribe(
      (response: any) => {
        console.log(`${plant.common_name} has been watered!`);
        plant.watered = true;
        plant.last_watered = response.last_watered;
      },
      (error) => {
        console.error('Error watering plant:', error);
      }
    );
  }

  // TODO
  undoWaterPlant(plant: Plant): void {
    console.log(`${plant.scientific_name} watering has been reverted!`);
    plant.watered = false;
  }

  /** ngOnInit
      Lifecycle hook to subscribe to route parameters
      Listens to refresh collection observable to refresh plant list whenever
      collection is refreshed.
      Also sets up reactive form control for plantSearch with debounced
  */
  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.collectionId = +id;
        this.getCollectionDetails();
        this.getCollectionPlants();
      } else {
        console.error('Collection ID is missing');
      }
      this.collectionService.refreshCollection$.subscribe(() => {
        this.getCollectionPlants();
      });
    });

    this.filteredOptions = this.plantSearch.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap((value) => this.searchPlants(value || ''))
    );
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

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
        last_watered: 'Today',
        watered: false,
        id: this.nextPlantId++,
      });
    }

    this.plantSearch.setValue('');
  }

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

  clearSelections(): void {
    this.selectedPlants = [];
  }

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

  getCollectionPlants() {
    const url = `${environment.apiUrl}/collection/${this.collectionId}/plants`;

    this.http.get<{ success: boolean; plants: Plant[] }>(url).subscribe(
      (response) => {
        if (response.success) {
          this.plantCount = response.plants.length;
          this.dataSource.data = response.plants;
          this.dataSource.paginator = this.paginator;
        } else {
          console.error('Failed to fetch plants');
        }
      },
      (error) => {
        console.error('Error fetching plants:', error);
      }
    );
  }

  openEditPlantModal(): void {
    // Open the modal and pass the selectedPlant data as input
    this.dialog.open(EditPlantComponent, {
      width: '400px', // Adjust width of the modal
      data: {
        plant: this.selectedPlant, // Pass the selected plant as input to the modal
      },
    });
  }

  editPlant(plant: Plant): void {
    console.log(`Editing plant: ${plant.common_name}`);

    this.selectedPlant = plant;
    this.openEditPlantModal();
  }

  deletePlant(plant: Plant): void {
    console.log(`Deleting plant: ${plant.common_name}`);

    const collectionId = plant.collectionId;
    const plantId = plant.id;

    // Send PUT request to backend to soft delete the plant
    this.http
      .put(
        `${environment.apiUrl}/collection/${this.collectionId}/plant/${plantId}/delete`,
        {}
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Plant deleted successfully.', 'Close', {
            duration: 3000,
          });

          // Remove the plant from the table
          this.dataSource.data = this.dataSource.data.filter(
            (p) => p.id !== plantId
          );
          this.plantCount = this.dataSource.data.length;
        },
        error: (err) => {
          console.error('Error deleting plant:', err);
          this.snackBar.open(
            'Failed to delete plant. Please try again.',
            'Close',
            {
              duration: 3000,
            }
          );
        },
      });
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

  // addPlant(collectionId: number) {
  //   if (this.selectedPlants.length === 0) {
  //     this.showToast('Please select a plant to add.');
  //     return;
  //   }

  //   const selectedPlant = this.selectedPlants[0];

  //   if (selectedPlant) {
  //     const { scientific_name, common_name, quantity } = selectedPlant;

  //     this.collectionService
  //       .addPlantToCollection(
  //         collectionId,
  //         this.nextPlantId++,
  //         scientific_name,
  //         common_name,
  //         quantity
  //       )
  //       .subscribe(
  //         (response) => {
  //           console.log('Plant added to collection', response);
  //           this.selectedPlants = [];
  //           this.getCollectionPlants();
  //           this.showToast('Plant added successfully.');
  //         },
  //         (error) => {
  //           console.error('Error adding plant to collection:', error);
  //           this.showToast('Error adding plant to collection.');
  //         }
  //       );
  //   }
  // }

  openNewsModal() {
    console.log('CollectionComponent: Triggering openNewsModal...');
    this.modalService.openNewsModal();
  }

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
    }));

    this.collectionService
      .addPlantsToCollection(collectionId, plantsToAdd)
      .subscribe(
        (response) => {
          console.log('Plants added to collection', response);
          this.selectedPlants = [];
          this.getCollectionPlants();
          this.showToast('Plants added successfully.');
        },
        (error) => {
          console.error('Error adding plants to collection:', error);
          this.showToast('Error adding plants to collection.');
        }
      );
  }
}
