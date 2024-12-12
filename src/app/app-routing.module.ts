import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AddPlantComponent } from './add-plant/add-plant.component';
import { CollectionComponent } from './collection/collection.component';
import { AuthComponent } from './auth/auth.component';
import { SignupComponent } from './signup/signup.component';
import { AuthGuard } from './auth.guard';

const routes: Routes = [
  // Protected Routes
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard], // Only accessible if authenticated
  },
  {
    path: 'add-plants',
    component: AddPlantComponent,
    canActivate: [AuthGuard], // Only accessible if authenticated
  },
  {
    path: 'collection/:id',
    component: CollectionComponent,
    canActivate: [AuthGuard], // Only accessible if authenticated
  },

  // Public Routes
  { path: 'auth', component: AuthComponent }, // Login page (public)
  { path: 'signup', component: SignupComponent }, // Signup page (public)

  // Default Route
  { path: '', redirectTo: '/auth', pathMatch: 'full' }, // Default to auth (login)

  // Fallback Route for unmatched paths
  { path: '**', redirectTo: '/auth' }, // Redirect any unknown routes to auth page
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
