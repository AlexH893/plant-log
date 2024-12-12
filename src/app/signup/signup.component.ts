import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { SignupService } from './signup.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent implements OnInit {
  goToAuth() {
    this.router.navigate(['/auth']);
  }
  @ViewChild('usernameInput') usernameInput!: ElementRef;
  signupForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private signupService: SignupService
  ) {
    this.signupForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.maxLength(30)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordsMatchValidator }
    );
  }

  ngOnInit(): void {
    setTimeout(() => this.usernameInput.nativeElement.focus(), 0);
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      const { username, password } = this.signupForm.value;
      this.signupService.signup(username, password).subscribe({
        next: (response) => {
          console.log('Signup successful:', response);
          this.router.navigate(['/auth']); // Redirect to login
        },
        error: (err) => {
          console.error('Signup error:', err);
          alert(err.error?.error || 'An error occurred during signup.');
        },
      });
    }
  }

  passwordsMatchValidator(
    group: AbstractControl
  ): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }
}
