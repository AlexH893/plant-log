import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AddPlantComponent } from './add-plant/add-plant.component';
import { CollectionComponent } from './collection/collection.component';
const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [],
  },
  { path: 'add-plants', component: AddPlantComponent },
  { path: 'collection/:id', component: CollectionComponent },


];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
