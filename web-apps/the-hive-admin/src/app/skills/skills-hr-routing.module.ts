import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SkillsHRComponent } from './pages/skills-hr/skills-hr.page';

const routes: Routes = [{ path: '', component: SkillsHRComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SkillsHRRoutingModule { }
