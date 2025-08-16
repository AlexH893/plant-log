import { Component, OnInit } from '@angular/core';
import { ModalService } from '../modal.service';
import { NewsService } from '../news.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss'],
})
export class NewsComponent implements OnInit {
  isVisible = false;
  newUpdate = false;
  newsList = [
    {
      id: 5,
      title: 'Frontend Tweaks - Aug 16',
      content:
        'Improved error handling, styling tweaks. The database issue resulting in data loss has been fixed',
    },
    {
      id: 4,
      title: 'Track Fertilizing - March 14',
      content:
        'You can now track the fertilization of your plants, just like you already track watering. In addition to several updates to the table, the option to toggle the visibility of the fertilization feature has been added, allowing you to hide or show it as needed.',
    },
    {
      id: 3,
      title: 'Total Plant Count - March 8',
      content: 'Displays count of all of your plants, frontend tweaks',
    },
    {
      id: 2,
      title: 'Times Watered - Feb 22',
      content:
        'Keep track of how many times you water specific plants. Also various backend updates, database changes for future planned features',
    },
    {
      id: 1,
      title: 'App is live',
      content:
        'App is released. Create an account, then a collection which holds your plants',
    },
  ];
  selectedNews: any = null;
  userId: number = 0;

  constructor(
    private modalService: ModalService,
    private newsService: NewsService,
    private authService: AuthService
  ) {
    // Subscribe to modal visibility changes
    this.modalService.newsModalVisible$.subscribe((isVisible) => {
      console.log('NewsComponent subscription received visibility:', isVisible);
      this.isVisible = isVisible;
    });
  }

  ngOnInit() {
    this.getUserInfo();
    this.checkIfRead();
  }

  // Ensure user ID is retrieved from AuthService and converted to number
  getUserInfo() {
    const userInfo = this.authService.getUserInfo();
    if (userInfo && userInfo.id) {
      this.userId = Number(userInfo.id);
    } else {
      console.log('User not found in token');
    }
  }

  // Opens the modal with the selected news item
  openModal(news: any) {
    this.selectedNews = news;
    this.markNewsAsRead();
  }

  // Closes the modal
  closeNewsInfo() {
    this.selectedNews = null;
  }

  closeNewsModal() {
    this.modalService.closeNewsModal();
  }

  // Call the service to mark news as read
  markNewsAsRead() {
    if (this.userId) {
      this.newsService.markAsRead(this.userId).subscribe(() => {
        this.newUpdate = false;
      });
    } else {
      console.log('User ID not available');
    }
  }

  // Check if the user has read the news
  checkIfRead() {
    if (this.userId) {
      this.newsService.getNewUpdates(this.userId).subscribe((status) => {
        this.newUpdate = status.hasNewUpdate;
      });
    } else {
      console.log('User ID not available');
    }
  }
}
