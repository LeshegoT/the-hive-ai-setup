import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ParamMap, ActivatedRoute } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { LevelUpService } from '../../services/level-up.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-create-activity-link',
    templateUrl: './create-activity-link.component.html',
    styleUrls: ['./create-activity-link.component.css'],
    standalone: false
})
export class CreateActivityLinkComponent implements OnInit, OnDestroy {
  dataSubscription: Subscription = new Subscription();

  linkForm: UntypedFormGroup;
  activity;
  activityId;
  types$;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private formBuilder: UntypedFormBuilder,
    private levelUpService: LevelUpService,
    private snackBar: MatSnackBar
  ) {
    this.linkForm = this.formBuilder.group({
      type: [
        '',
        Validators.required
      ],
      link: [
        '',
        Validators.required
      ]
    });
  }

  ngOnInit() {
    const activityId$ = this.route.paramMap.pipe(
      map((params: ParamMap) => params.get('id'))
    );

    const activitySubscription = activityId$.pipe(
      switchMap((id) => {
        this.activityId = id;
        return this.levelUpService.getLevelUpActivity(id)
      })
    ).subscribe((activity) => this.activity = activity);

    this.dataSubscription.add(activitySubscription);

    this.types$ = this.levelUpService.getLevelUpLinkTypes();
  }

  async createLink() {
    if(!this.linkForm.valid) {
      this.error = true;
      return;
    }

    this.error = false;

    const activityLink = this.linkForm.getRawValue();
    activityLink.activityId = this.activityId;

    const createSubscription = this.levelUpService.createActivityLink(activityLink).subscribe(() => {
      this.snackBar.open('Activity link created successfully', '', { duration: 2000 });
      this.linkForm.reset();
    });
    this.dataSubscription.add(createSubscription);
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}
