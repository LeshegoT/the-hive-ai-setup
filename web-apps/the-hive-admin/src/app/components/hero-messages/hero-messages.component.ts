import { Component, OnInit, Input, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { HeroesService } from '../../services/heroes.service';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-hero-messages',
    templateUrl: './hero-messages.component.html',
    styleUrls: ['./hero-messages.component.css'],
    standalone: false
})
export class HeroMessagesComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() heroUPN$: Observable<string>;
  private dataSubscription: Subscription = new Subscription();
  @ViewChild(MatSort) messageSort: MatSort;
  messageData = new MatTableDataSource();
  messageColumns = [
    'creationDate',
    'createdByUserPrincipleName',
    'heroUserPrincipleName',
    'description',
    'text'
  ];

  constructor(private heroesService: HeroesService) { }

  ngOnInit() {
    const messagesSubscription = this.heroUPN$.pipe(
      switchMap((upn) => this.heroesService.getAllHeroMessages(upn)
    )).subscribe((messages) => {
      this.messageData.data = messages;
    });
    this.dataSubscription.add(messagesSubscription);
  }
  
  ngAfterViewInit() {
    this.messageData.sort = this.messageSort;
  }

  applyFilter(filterValue: string) {
    this.messageData.filter = filterValue.trim().toLowerCase();
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }

}
