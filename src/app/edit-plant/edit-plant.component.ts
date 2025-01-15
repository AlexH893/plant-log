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
import { environment } from 'src/environments/environment'; // Generic import

@Component({
  selector: 'app-edit-plant',
  templateUrl: './edit-plant.component.html',
  styleUrls: ['./edit-plant.component.scss'],
})
export class EditPlantComponent implements OnInit {
  selectedPlant: any; // This will hold the plant data passed to the component
  lastWatered: Date | null = null; // Prop to bind datepicker to
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

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // Autofocus the input field when the modal opens
    setTimeout(() => {
      this.plantNameInput.nativeElement.focus();
      this.lastWatered = null;
    }, 0);
  }

  renamePlant(): void {
    const newNickname = this.plantNameInput.nativeElement.value;
    const collectionId = this.selectedPlant.collectionId;
    const plantId = this.selectedPlant.id;

    // Declare formattedDate for the last watered field
    let formattedDate: string | undefined;

    // Create an object to hold the fields that will be updated
    const updateData: any = {};
    let successMessage = ''; // Initialize a variable to hold the success message

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
    if (newNickname.trim()) {
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
  }

  formatLastWatered(date: string | null): string {
    if (!date) return 'Not set'; // Return a default value if the date is null or undefined

    const formattedDate = new Date(date);
    return formattedDate.toLocaleDateString(); // You can customize the format here
  }

  closeModal() {
    this.dialogRef.close();
  }
}
