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
  selector: 'app-edit-collection',
  templateUrl: './edit-collection.component.html',
  styleUrls: ['./edit-collection.component.scss'],
})
export class EditCollectionComponent implements OnInit {
  dialogRef: any;
  ngOnInit(): void {}

  closeModal() {
    this.dialogRef.close();
  }
}
