import { Component, OnInit } from '@angular/core';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    standalone: false
})
export class HomeComponent implements OnInit {
  cards: any;

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit() {
    this.cards = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
      map(({ matches }) => {
        if (matches) {
          return [
            { title: 'View User Progress', cols: 1, rows: 1, route: '/userProgress' }
          ];
        }

        return [
          { title: 'View User Progress', cols: 1, rows: 1, route: '/userProgress' }
        ];
      })
    );
  }
}
