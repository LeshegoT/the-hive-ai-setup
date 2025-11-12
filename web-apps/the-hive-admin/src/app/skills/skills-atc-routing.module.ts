import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SkillsATCComponent } from './pages/skills-atc/skills-atc.page';

const routes: Routes = [{ path: '', component: SkillsATCComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SkillsATCRoutingModule { }
