import { Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment.prod';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  collections: any[] = []; // Variable to store collections
  listName = new FormControl('');
  isFormVisible = false;
  collectionUrl = `${environment.apiUrl}/collection`; // Adjust the backend URL as needed
  @ViewChild('collectionInput') collectionInput!: ElementRef;

  constructor(private http: HttpClient, private router: Router) {}

  toggleForm() {
    this.isFormVisible = !this.isFormVisible; // Toggle form visibility
    if (this.isFormVisible) {
      setTimeout(() => {
        this.collectionInput.nativeElement.focus();
        // Ensure the element is visible to the viewport
        this.collectionInput.nativeElement.scrollIntoView({
          behavior: 'smooth',
        });
      }, 0);
    }
  }

  createCollection() {
    const collectionName = this.listName.value;
    if (collectionName) {
      // Make HTTP POST request to create a new collection
      this.http
        .post(
          this.collectionUrl,
          { name: collectionName },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        )
        .subscribe({
          next: (response: any) => {
            console.log('Collection created successfully:', response);
            this.listName.reset(); // Clear the input field
            this.isFormVisible = false; // Hide the form
            this.getCollection(); // Refresh collections after creation
          },
          error: (error) => {
            console.error('Error creating collection:', error);
          },
        });
    }
  }

  // Call getCollection when the page is loaded
  ngOnInit() {
    this.getCollection();
  }

  // Method to navigate to the collection detail page
  goToCollection(collectionId: number) {
    this.router.navigate(['/collection', collectionId]); // Navigate to the collection details page
  }

  // Get collections from the backend
  getCollection() {
    this.http.get<any[]>(this.collectionUrl).subscribe({
      next: (response: any[]) => {
        this.collections = response; // Store collections in the variable
        console.log('Fetched collections:', this.collections);
      },
      error: (error) => {
        console.error('Error fetching collections:', error);
      },
    });
  }

  ngAfterViewInit(): void {
    // Autofocus the input field when the modal opens
    setTimeout(() => {
      this.collectionInput.nativeElement.focus();
    }, 0);
  }
}
