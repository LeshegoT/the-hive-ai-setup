import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { LevelUpService } from '../../services/level-up.service';
import { map, switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-level-up-qr',
    templateUrl: './level-up-qr.component.html',
    styleUrls: ['./level-up-qr.component.css'],
    standalone: false
})
export class LevelUpQrComponent implements OnInit, OnDestroy {
  private dataSubscription: Subscription = new Subscription();
  activity;
  link;

  constructor(private route: ActivatedRoute, private levelUpService: LevelUpService) { }

  ngOnInit() {
    let activityId;

    const activityId$ = this.route.paramMap.pipe(
      map((params: ParamMap) => params.get('activityId'))
    );

    this.dataSubscription.add(activityId$
      .pipe(
        switchMap((id) => {
          activityId = id;
          return this.levelUpService.getLevelUpActivity(id);
        })
      )
      .subscribe((activity) => {
        this.link = `https://the-hive.bbd.co.za/attend-level-up/${activity.levelUpId}/activity/${activityId}`;
        this.activity = activity;
      }));
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}
