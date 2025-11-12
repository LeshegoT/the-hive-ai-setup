import { Component, OnInit, ViewChild } from '@angular/core';
import { EventOrganiserService } from '../../services/event-organisers.service';
import { EventOrganiser } from '../../shared/interfaces';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

@Component({
    selector: 'app-events',
    templateUrl: './events.component.html',
    styleUrls: ['./events.component.css'],
    standalone: false
})
export class EventsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  constructor(private eventOrganiserService: EventOrganiserService) {}

  eventOrganisers: MatTableDataSource<EventOrganiser>;

  ngOnInit() {
    this.getEventOrganisers();
  }

  getEventOrganisers() {
    this.eventOrganiserService.getEventOrganisers().subscribe((eventOrganisers) => {
      this.eventOrganisers = new MatTableDataSource<EventOrganiser>(eventOrganisers);
    });
  }
}
