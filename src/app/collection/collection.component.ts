import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { CollectionService } from '../collection.service';
import { Router } from '@angular/router';
import { NewsComponent } from '../news/news.component';
import { ModalService } from '../modal.service';
import { UserService } from '../user.service';
import { AuthService } from '../auth.service';
import { PlantService } from '../plant.service'; // Import the PlantService
import { AddPlantComponent } from '../add-plant/add-plant.component';
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
import { environment } from 'src/environments/environment'; // Generic import
import { Plant } from 'src/plant.model';

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
  showFertilizeFlag = false;
  isFertilized: boolean = false;
  userId!: number;
  fertilizeState: number = 0; // Default state

  getUserId() {
    const token = localStorage.getItem('authToken');
    const userInfo = this.authService.getUserInfo();
    if (userInfo) {
      this.userId = Number(userInfo.id);
    }
  }

  toggleFertilize(event: any): void {
    this.getUserId(); // Ensure userId is set

    const newState = event.checked ? 1 : 0;

    if (!this.userId) {
      console.error('User ID is undefined');
      return;
    }

    this.userService.updateFertilizeState(this.userId, newState).subscribe(
      (response) => {
        console.log('Fertilize state updated successfully:', response);
        this.showFertilizeFlag = event.checked; // Update the flag
        this.updateDisplayedColumns(); // Update displayed columns
      },
      (error) => {
        console.error('Error updating fertilize state:', error);
        this.showFertilizeFlag = !event.checked; // Revert in case of error
      }
    );
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

  displayedColumns: string[] = [
    'name',
    'last_watered',
    // ...(this.showFertilizeFlag ? ['last_fertilized'] : []),
    'water',
    'actions',
  ];

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
  today: Date = new Date();

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private collectionService: CollectionService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private modalService: ModalService,
    private userService: UserService,
    private authService: AuthService,
    private plantService: PlantService
  ) {
    this.collectionId = 1;
  }

  // Water plant - send current timestamp and update times_watered
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

        // Update times_watered if it's returned in the response
        if (response.times_watered !== undefined) {
          plant.times_watered = response.times_watered;
        } else {
          // Fallback in case the response doesn't include it
          plant.times_watered = (plant.times_watered || 0) + 1;
        }
      },
      (error) => {
        console.error('Error watering plant:', error);
      }
    );
  }

  // Fertilize plant - send current timestamp and update times_fertilized
  fertilizePlant(plant: Plant): void {
    console.log('Collection ID:', this.collectionId);
    console.log('Plant ID:', plant.id);

    if (!this.collectionId || !plant.id) {
      console.error('Plant or Collection ID is undefined');
      return;
    }

    const url = `${environment.apiUrl}/collection/${this.collectionId}/fertilize-plant/${plant.id}`;

    this.http.put(url, {}).subscribe(
      (response: any) => {
        console.log(`${plant.common_name} has been fertilized!`);
        plant.fertilized = true;
        plant.last_fertilized = response.last_fertilized;

        // Update times_fertilized if it's returned in the response
        if (response.times_fertilized !== undefined) {
          plant.times_fertilized = response.times_fertilized;
        } else {
          // Fallback in case the response doesn't include it
          plant.times_fertilized = (plant.times_fertilized || 0) + 1;
        }
      },
      (error) => {
        console.error('Error fertilizing plant:', error);
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
    this.getUserId();

    if (this.userId) {
      this.getFertilizeState();
      this.updateDisplayedColumns(); // Fix: Ensure columns update when fertilize state is fetched
    } else {
      console.error('User ID is undefined');
    }

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.collectionId = +id;
        console.log(' Collection ID is : ' + this.collectionId);
        this.getCollectionDetails();
        this.loadCollectionPlants();
      } else {
        console.error('Collection ID is missing');
      }
      this.collectionService.refreshCollection$.subscribe(() => {
        this.loadCollectionPlants();
      });
    });

    // this.filteredOptions = this.plantSearch.valueChanges.pipe(
    //   startWith(''),
    //   debounceTime(300),
    //   switchMap((value) => this.searchPlants(value || ''))
    // );
  }

  updateDisplayedColumns() {
    this.displayedColumns = [
      'name',
      'last_watered',
      // ...(this.showFertilizeFlag ? ['last_fertilized'] : []),
      'water',
      'actions',
    ];
  }

  // Get fertilizeState from the backend and set the toggle state
  getFertilizeState(): void {
    this.userService.getFertilizeState(this.userId).subscribe(
      (response) => {
        this.fertilizeState = response.fertilizeState; // Assign fertilizeState from response
        // If fertilizeState is 1, enable the toggle; if it's 0, disable it
        this.showFertilizeFlag = this.fertilizeState === 1; // Set toggle based on state
        this.updateDisplayedColumns(); // Update columns when state is fetched
      },
      (error) => {
        console.error('Error fetching fertilize state:', error);
      }
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
  // Method to load plants from the service
  loadCollectionPlants() {
    this.plantService
      .getCollectionPlants(this.collectionId.toString())
      .subscribe(
        (response) => {
          if (response.success) {
            this.plantCount = response.plants.length; // Set the plant count
            this.dataSource.data = response.plants.map((plant: Plant) => ({
              ...plant,
              times_watered: plant.times_watered ?? 0, // Ensure it's always a number
              times_fertilized: plant.times_fertilized ?? 0, // Ensure it's always a number
            }));
            // Set the paginator if you're using one
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

  openNewsModal() {
    console.log('CollectionComponent: Triggering openNewsModal...');
    this.modalService.openNewsModal();
  }

  openAddPlantModal() {
    if (!this.collectionId) {
      console.error(
        'Collection ID is missing when trying to open add plant modal'
      );
      return;
    }

    this.modalService.openAddPlantModal(this.collectionId.toString());
  }

  getDaysAgo(dateString: string): string {
    if (!dateString) return '';
    const today = new Date();
    const lastDate = new Date(dateString);
    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
}
