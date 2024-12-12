import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service'; // Import AuthService

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit {
  @ViewChild('usernameInput') usernameInput!: ElementRef; // Reference the username input field
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService // Inject AuthService
  ) {
    this.loginForm = this.fb.group({
      username: [
        '',
        [
          Validators.required, // Username is required
          Validators.maxLength(30), // Maximum length is 30 characters
        ],
      ],
      password: ['', [Validators.required, Validators.minLength(6)]], // Password field with validators
    });
  }

  ngOnInit(): void {
    // Set focus to username field after the view initializes
    // setTimeout(() => this.usernameInput.nativeElement.focus(), 0);
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;

      this.authService.login(username, password).subscribe({
        next: (response: any) => {
          console.log('Login successful:', response);
          // Store the token in localStorage
          localStorage.setItem('authToken', response.token);

          // Optionally: store other user info like userId or username
          // localStorage.setItem('username', response.username); // if you want to store username

          // Navigate to the home page after successful login
          this.router.navigate(['/home']);
        },
        error: (err: any) => {
          console.error('Login error:', err);
          this.errorMessage =
            err.error?.error || 'An error occurred during login.';
        },
      });
    }
  }

  goToSignup(): void {
    this.router.navigate(['/signup']); // Navigate to the signup route
  }

  ngAfterViewInit(): void {
    // Set focus to username field after the view is initialized
    setTimeout(() => this.usernameInput.nativeElement.focus(), 0);
  }
}
