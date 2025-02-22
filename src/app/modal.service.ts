import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { NewsComponent } from './news/news.component'; // Ensure path is correct
import { NewsService } from './news.service';
@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private newsModalVisibleSubject = new BehaviorSubject<boolean>(false);
  newsModalVisible$ = this.newsModalVisibleSubject.asObservable();

  private dialogRef: any; // Store the reference to the dialog

  constructor(private dialog: MatDialog) {}

  openNewsModal(): void {
    // Show the modal by emitting true
    this.newsModalVisibleSubject.next(true);

    // Open the dialog
    this.dialogRef = this.dialog.open(NewsComponent, {
      width: '80%',
      height: '80%',
      data: {}, // You can pass data if needed
    });

    // Handle closing when the modal is closed
    this.dialogRef.afterClosed().subscribe(() => {
      this.newsModalVisibleSubject.next(false); // Hide modal when closed
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
