import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PeoplePlanningComponent } from './pages/people-planning/people-planning.page';

const routes: Routes = [{ path: '', component: PeoplePlanningComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PeoplePlanningRoutingModule { }
