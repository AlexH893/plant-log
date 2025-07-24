import { Component } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
  constructor(private authService: AuthService) {}
  title = 'plant-log';
  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      const user = this.authService.getUserInfo();
      console.log('User still authenticated:', user);
      // store user in a shared service or app state
    } else {
      console.log('User not authenticated or token expired.');
      this.authService.logout(); // clear any old token
    }
  }
}
