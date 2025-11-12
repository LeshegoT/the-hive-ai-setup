import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProgrammeService } from '../../services/programme.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-programmes',
    templateUrl: './programmes.component.html',
    styleUrls: ['./programmes.component.css'],
    standalone: false
})
export class ProgrammesComponent implements OnInit, OnDestroy {
  dataSubscription: Subscription = new Subscription();
  programmes: [];

  constructor(private programmeService: ProgrammeService) {}

  ngOnInit() {
    this.refreshProgrammes();
    
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }

  refreshProgrammes() {
    const programmeSubscription = this.programmeService.getAllProgrammes().subscribe((programmes) => {
      this.programmes = programmes;
    });
    this.dataSubscription.add(programmeSubscription);
  }
}
