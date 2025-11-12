import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FeedbackComponent } from './pages/feedback/feedback.page';

const routes: Routes = [
    { path: '', component: FeedbackComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ReviewRoutingModule {  }