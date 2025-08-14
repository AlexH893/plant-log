import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'; // Import MatDialogRef
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CollectionComponent } from '../collection/collection.component';
import { CollectionService } from '../collection.service';
import { environment } from 'src/environments/environment';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin, of } from 'rxjs';

interface Food {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-edit-plant',
  templateUrl: './edit-plant.component.html',
  styleUrls: ['./edit-plant.component.scss'],
})
export class EditPlantComponent implements OnInit {
  collections: any[] = [];
  selectedCollectionId: string | null = null;
  selectedPlant: any; // This will hold the plant data passed to the component
  lastWatered: Date | null = null; // Prop to bind datepicker to
  isSaving = false;
  @ViewChild('plantNameInput') plantNameInput!: ElementRef;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<EditPlantComponent>,
    private collectionService: CollectionService
  ) {
    // Assign the received plant data to selectedPlant
    this.selectedPlant = data.plant;
    // Initialize the lastWatered with the current value of last_watered in selectedPlant
    this.lastWatered = this.selectedPlant.last_watered || null;
  }

  ngOnInit() {
    this.collectionService.getCollections().subscribe({
      next: (response) => {
        this.collections = response;
      },
      error: (error) => {
        console.error('Error fetching collections:', error);
      },
    });
  }

  ngAfterViewInit(): void {
    // Autofocus the input field when the modal opens
    setTimeout(() => {
      this.plantNameInput.nativeElement.focus();
      this.lastWatered = null;
    }, 0);
  }

  // todo
  private toMysqlDateTime(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1); // months are 0-based
    const day = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
  }

  private hasNicknameChange(newNickname: string): boolean {
    const current = this.selectedPlant?.nickname ?? '';
    const trimmed = newNickname.trim();
    return !!trimmed && trimmed !== String(current).trim();
  }

  private hasLastWateredChange(): boolean {
    if (!this.lastWatered && !this.selectedPlant.last_watered) return false;
    if (!this.lastWatered || !this.selectedPlant.last_watered) return true;
    const newTime = new Date(this.lastWatered).getTime();
    const oldTime = new Date(this.selectedPlant.last_watered).getTime();
    return newTime !== oldTime;
  }

  saveChanges(): void {
    const newNickname = (this.plantNameInput.nativeElement.value || '').trim();
    const collectionId = Number(this.selectedPlant.collectionId);
    const plantInstanceId = Number(this.selectedPlant.id);

    const updateData: any = {};
    let successMessage = '';

    // Prepare updates
    // Declare formattedDate for the last watered field
    let formattedDate: string | undefined;
    const ops = [];

    // 1. nickname
    if (this.hasNicknameChange(newNickname)) {
      ops.push(
        this.http.put(
          `${environment.apiUrl}/collection/${collectionId}/plant/${plantInstanceId}/nickname`,
          { nickname: newNickname }
        )
      );
    }

    // 2. last_watered
    if (this.hasLastWateredChange()) {
      formattedDate = new Date(this.lastWatered!)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');
      ops.push(
        this.http.put(
          `${environment.apiUrl}/collection/${collectionId}/plant/${plantInstanceId}/last-watered`,
          { lastWatered: formattedDate }
        )
      );
      updateData.last_watered = formattedDate;
      successMessage += 'Plant last watered date updated successfully! ';
    }

    // 3. Check for collection change
    const newCollectionId = Number(this.selectedCollectionId);
    const currentCollectionId = this.selectedPlant?.collection_id;

    if (newCollectionId && newCollectionId !== currentCollectionId) {
      updateData.collectionId = newCollectionId;
      successMessage += ' Plant collection updated successfully';
      console.log('Trying to move plant', {
        newCollectionId,
        currentCollectionId,
      });

      ops.push(
        this.http.put(
          `${environment.apiUrl}/collection/${currentCollectionId}/plant/${plantInstanceId}/move/${newCollectionId}`,
          {}
        )
      );
    }

    // If no changes were made, show a test then return
    if (Object.keys(updateData).length === 0) {
      this.snackBar.open('No changes were made.', 'Close', {
        duration: 2000,
      });
      return;
    }

    // Update the nickname if a new nickname is provided
    if (newNickname.trim()) {
      updateData.nickname = newNickname;
      successMessage += 'Plant nickname updated successfully! ';
    }

    // Update the last watered field if a date is selected
    if (this.lastWatered) {
      // Format the lastWatered date into MySQL-compatible format (YYYY-MM-DD HH:MM:SS)
      formattedDate = new Date(this.lastWatered)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');
      updateData.last_watered = formattedDate;
      successMessage += 'Plant last watered date updated successfully! ';
    }

    // If no changes were made, show a toast and return
    if (Object.keys(updateData).length === 0) {
      this.snackBar.open('No changes were made.', 'Close', {
        duration: 3000,
      });
      return;
    }

    // Update nickname if provided
    const plantId = this.selectedPlant?.id;

    if (plantId && newNickname.trim()) {
      this.http
        .put(
          `${environment.apiUrl}/collection/${collectionId}/plant/${plantId}/nickname`,
          { nickname: newNickname }
        )
        .subscribe({
          next: () => {
            if (!successMessage) {
              successMessage += 'Plant nickname updated successfully! ';
            }
          },
          error: (err) => {
            console.error('Error updating plant nickname:', err);
            this.snackBar.open(
              'Failed to update plant nickname. Please try again.',
              'Close',
              { duration: 3000 }
            );
          },
        });
    }

    // Update last watered field if a date is selected
    if (formattedDate) {
      this.http
        .put(
          `${environment.apiUrl}/collection/${collectionId}/plant/${plantId}/last-watered`,
          { lastWatered: formattedDate }
        )
        .subscribe({
          next: () => {
            if (!successMessage) {
              successMessage +=
                'Plant last watered date updated successfully! ';
            }
            this.snackBar.open(successMessage, 'Close', { duration: 3000 });
            this.dialogRef.close(); // Close modal after updating
            // Notify the service
            this.collectionService.triggerRefreshCollection();
          },
          error: (err) => {
            console.error('Error updating plant last watered:', err);
            this.snackBar.open(
              'Failed to update plant last watered. Please try again.',
              'Close',
              { duration: 3000 }
            );
          },
        });
    }

    // Close the modal if the nickname was updated and there’s no last watered update
    if (newNickname.trim() && !formattedDate) {
      this.snackBar.open(successMessage, 'Close', { duration: 3000 });
      this.dialogRef.close();
      this.collectionService.triggerRefreshCollection();
    }

    if (ops.length > 0) {
      forkJoin(ops).subscribe({
        next: () => {
          this.snackBar.open(successMessage, 'Close', { duration: 3000 });
          this.dialogRef.close();
          this.collectionService.triggerRefreshCollection();
        },
        error: (err) => {
          console.error('Error saving changes:', err);
          this.snackBar.open(
            'Failed to save changes. Please try again.',
            'Close',
            {
              duration: 3000,
            }
          );
        },
      });
    }
  }

  formatLastWatered(date: string | null): string {
    if (!date) return 'Not set'; // Return a default value if the date is null or undefined

    const formattedDate = new Date(date);
    return formattedDate.toLocaleDateString();
  }

  closeModal() {
    this.dialogRef.close();
  }
}
