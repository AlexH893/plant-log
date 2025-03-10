import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const token = localStorage.getItem('authToken'); // Get token from localStorage
    if (token) {
      return true; // Allow access if token exists
    } else {
      this.router.navigate(['/auth']); // Redirect to login page if token is missing
      return false; // Prevent access
    }
  }
}
