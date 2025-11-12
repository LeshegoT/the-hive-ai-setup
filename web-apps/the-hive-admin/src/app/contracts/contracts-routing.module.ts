import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Contracts } from './pages/contracts/contracts.page';

const routes: Routes = [{ path: '', component: Contracts }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContractsRoutingModule { }
