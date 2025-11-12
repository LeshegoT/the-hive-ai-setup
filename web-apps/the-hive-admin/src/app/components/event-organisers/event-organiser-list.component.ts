import { Component, ViewChild, Input, OnChanges, OnDestroy } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { EventOrganiserService } from '../../services/event-organisers.service';
import { EventOrganiser } from '../../shared/interfaces';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-event-organiser-list',
    templateUrl: './event-organiser-list.component.html',
    styleUrls: ['./event-organiser-list.component.css'],
    standalone: false
})
export class EventOrganiserListComponent implements OnChanges, OnDestroy {
  displayedColumns: string[] = ['Email', 'Remove-organiser'];
  @Input() eventOrganisers = new MatTableDataSource<EventOrganiser>([]);
  private subscription: Subscription = new Subscription();

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private eventOrganiserService: EventOrganiserService, private snackbar: MatSnackBar) {}

  ngOnChanges() {
    if(this.eventOrganisers && !this.eventOrganisers.paginator) {
      this.eventOrganisers.paginator = this.paginator
    }
  }

  onRemove(eventOrganiserId: number) {
    this.subscription.add(
      this.eventOrganiserService.removeEventOrganiser(eventOrganiserId).subscribe(
        () => {
          this.snackbar.open('Removed event organiser.', 'dismiss', {
            duration: 3000,
          });
        },
        (error) => {
          this.snackbar.open(error, 'dismiss', {
            duration: 3000,
          });
        }
      )
    );
    this.subscription.add(this.subscribeToGetEventOrganisers());
  }

  private subscribeToGetEventOrganisers() {
    return this.eventOrganiserService.getEventOrganisers().subscribe((eventOrganisers) => {
      this.eventOrganisers.data = eventOrganisers;
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
