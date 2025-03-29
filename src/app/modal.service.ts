import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { NewsComponent } from './news/news.component'; // Ensure path is correct
import { NewsService } from './news.service';
import { AddPlantComponent } from './add-plant/add-plant.component';
@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private newsModalVisibleSubject = new BehaviorSubject<boolean>(false);
  private addPlantModalVisibleSubject = new BehaviorSubject<boolean>(false);

  newsModalVisible$ = this.newsModalVisibleSubject.asObservable();
  collectionId?: number;

  private dialogRef: any; // Store the reference to the dialog

  constructor(private dialog: MatDialog) {}

  openNewsModal(): void {
    // Show the modal by emitting true
    this.newsModalVisibleSubject.next(true);

    // Open the dialog
    this.dialogRef = this.dialog.open(NewsComponent, {
      width: '80%',
      height: '80%',
      data: {},
    });

    // Handle closing when the modal is closed
    this.dialogRef.afterClosed().subscribe(() => {
      this.newsModalVisibleSubject.next(false); // Hide modal when closed
    });
  }

  openAddPlantModal(collectionId: string) {
    this.addPlantModalVisibleSubject.next(true);

    // Pass collectionId to the modal
    this.dialogRef = this.dialog.open(AddPlantComponent, {
      width: '80%',
      height: '80%',
      data: { collectionId },
    });

    this.dialogRef.afterClosed().subscribe(() => {
      this.addPlantModalVisibleSubject.next(false); // Hide modal when closed
    });
  }

  closeNewsModal(): void {
    // Close the modal and set visibility to false
    if (this.dialogRef) {
      this.dialogRef.close();
    }
    this.newsModalVisibleSubject.next(false);
  }
}
