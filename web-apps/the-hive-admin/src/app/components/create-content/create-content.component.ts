import { Component, OnInit } from '@angular/core';
import { contentTypes } from '../../shared/content-types';

@Component({
    selector: 'app-create-content',
    templateUrl: './create-content.component.html',
    styleUrls: ['./create-content.component.css'],
    standalone: false
})

export class CreateContentComponent implements OnInit {
  allContent = contentTypes;
  content = this.allContent[0];

  constructor() { }

  ngOnInit() {
  }

}
