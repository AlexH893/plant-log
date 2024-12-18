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
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // Autofocus the input field when the modal opens
    setTimeout(() => {
      this.plantNameInput.nativeElement.focus();
    }, 0);
  }

  renamePlant(): void {
    const newNickname = this.plantNameInput.nativeElement.value;

    if (!newNickname.trim()) {
      this.snackBar.open('Nickname cannot be empty.', 'Close', {
        duration: 3000,
      });
      return;
    }
    const collectionId = this.selectedPlant.collectionId;
    const plantId = this.selectedPlant.id;

    this.http
      .put(
        `${environment.apiUrl}/collection/${collectionId}/plant/${plantId}/nickname`,
        { nickname: newNickname }
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Plant nickname updated successfully!', 'Close', {
            duration: 3000,
          });
          this.dialogRef.close();
          // Notify the service
          this.collectionService.triggerRefreshCollection();
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
}
