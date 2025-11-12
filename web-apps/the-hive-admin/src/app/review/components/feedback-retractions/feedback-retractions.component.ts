import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-feedback-retractions',
    templateUrl: './feedback-retractions.component.html',
    styleUrls: ['./feedback-retractions.component.css'],
    standalone: false
})
export class FeedbackRetractionsComponent implements OnInit {
  selectedView = 'view-retracted-feedback';

  constructor() {}

  ngOnInit() {}
}
