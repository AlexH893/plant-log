import { Component } from '@angular/core';
import { ModalService } from '../modal.service';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss'],
})
export class NewsComponent {
  isVisible = false;
  newsList = [
    {
      id: 1,
      title: 'App is live',
      content:
        'App is released. Create an account, then a collection which holds your plants',
    },
  ];
  selectedNews: any = null;

  constructor(private modalService: ModalService) {
    // Subscribe to modal visibility changes
    this.modalService.newsModalVisible$.subscribe((isVisible) => {
      console.log('NewsComponent subscription received visibility:', isVisible);
      this.isVisible = isVisible;
    });
  }

  // Opens the modal with the selected news item
  openModal(news: any) {
    this.selectedNews = news;
  }

  // Closes the modal
  closeNewsInfo() {
    this.selectedNews = null;
  }

  closeNewsModal() {
    this.modalService.closeNewsModal();
  }
}
