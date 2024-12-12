import { Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment.prod';
import { NewsComponent } from '../news/news.component';
import { MatDialog } from '@angular/material/dialog';
import { ModalService } from '../modal.service';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  collections: any[] = [];
  listName = new FormControl('');
  isFormVisible = false;
  collectionUrl = `${environment.apiUrl}/collection`;
  @ViewChild('collectionInput') collectionInput!: ElementRef;
  isNewsModalVisible: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    public dialog: MatDialog,
    public modalService: ModalService
  ) {}

  toggleForm() {
    this.isFormVisible = !this.isFormVisible;
    if (this.isFormVisible) {
      setTimeout(() => {
        this.collectionInput.nativeElement.focus();
        this.collectionInput.nativeElement.scrollIntoView({
          behavior: 'smooth',
        });
      }, 0);
    }
  }

  createCollection() {
    const collectionName = this.listName.value;
    const token = localStorage.getItem('authToken');

    if (collectionName && token) {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      this.http
        .post(this.collectionUrl, { name: collectionName }, { headers })
        .subscribe({
          next: (response: any) => {
            this.listName.reset();
            this.isFormVisible = false;
            this.getCollection();
          },
          error: (error) => {
            console.error('Error creating collection:', error);
          },
        });
    }
  }

  ngOnInit() {
    this.getCollection();
  }

  goToCollection(collectionId: number) {
    this.router.navigate(['/collection', collectionId]);
  }

  getCollection() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No token found');
      return;
    }

    this.http
      .get<any[]>(this.collectionUrl, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`,
        }),
      })
      .subscribe({
        next: (response: any[]) => {
          this.collections = response;
        },
        error: (error) => {
          console.error('Error fetching collections:', error);
        },
      });
  }

  ngAfterViewInit(): void {
    if (this.collectionInput) {
      setTimeout(() => {
        this.collectionInput.nativeElement.focus();
        this.collectionInput.nativeElement.scrollIntoView({
          behavior: 'smooth',
        });
      }, 0);
    } else {
      console.warn('collectionInput ViewChild not available');
    }
  }

  logout() {
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  home() {
    this.router.navigate(['/home']);
  }

  openNewsModal() {
    console.log('CollectionComponent: Triggering openNewsModal...');
    this.modalService.openNewsModal();
  }
}
