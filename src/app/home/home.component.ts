import { PlantService } from './../plant.service';
import { NewsService } from '../news.service';
import { Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { NewsComponent } from '../news/news.component';
import { MatDialog } from '@angular/material/dialog';
import { ModalService } from '../modal.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  totalPlants: number = 0;
  collections: any[] = [];
  listName = new FormControl('');
  isFormVisible = false;
  collectionUrl = `${environment.apiUrl}/collection`;
  countUrl =   `${environment.plantCountUrl}/total-plants`;

  @ViewChild('collectionInput') collectionInput!: ElementRef;
  isNewsModalVisible: boolean = false;
  userId: number | null = null;

  newUpdate: boolean = false;
  selectedNews: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    public dialog: MatDialog,
    public modalService: ModalService,
    private newsService: NewsService,
    private authService: AuthService,
    private plantService: PlantService
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
    setTimeout(() => {
      this.getUserId();
    }, 500); // Delay allows user info retrieval
    this.getCollection();
  }

  getUserId() {
    const token = localStorage.getItem('authToken');
    const userInfo = this.authService.getUserInfo();
    if (userInfo) {
      this.userId = Number(userInfo.id);
      this.checkForNewUpdates();

      this.fetchTotalPlants(this.userId);
    }
  }

  fetchTotalPlants(userId: number): void {
    this.plantService.getTotalPlants(userId).subscribe({
      next: (data) => {
        this.totalPlants = data.total_plants;
      },
      error: (error) => {
        console.error('Error fetching total plant count:', error);
      },
    });
  }

  // Check if the user has unread news
  checkForNewUpdates(): void {
    if (this.userId) {
      this.newsService.getNewUpdates(this.userId).subscribe((status) => {
        console.log('News update status:', status);
        this.newUpdate = status.hasNewUpdate;
      });
    } else {
      console.warn('userId is null, skipping checkForNewUpdates');
    }
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

  openNewsModal(news: any) {
    this.selectedNews = news;
    console.log('NewsComponent: Opening modal for news:', news);
    this.modalService.openNewsModal();
    this.newUpdate = false;

    // Ensure that userId is a valid number
    const userId = this.authService.getUserInfo()?.id ?? null;

    // If userId exists, convert it to number and proceed
    if (userId) {
      this.userId = Number(userId);
      this.newsService.markAsRead(this.userId).subscribe({
        next: (response) => {
          console.log('News marked as read:', response);
        },
        error: (error) => {
          console.error('Error marking news as read:', error);
        },
      });
    } else {
      console.error('User ID is undefined or invalid');
    }
  }
}
