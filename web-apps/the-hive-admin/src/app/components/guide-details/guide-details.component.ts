import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { GuidesService } from '../../services/guides.service';
import { QuestService } from '../../services/quest.service';

@Component({
    selector: 'app-guide-details',
    templateUrl: './guide-details.component.html',
    styleUrls: ['./guide-details.component.css'],
    standalone: false
})
export class GuideDetailsComponent implements OnInit {
  heroes$;
  guide$;
  heroColumns = [
    'heroUserPrincipleName',
    'specialisation',
    'goal',
    'lastHeroActivityDate',
    'missions',
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private questService: QuestService,
    private guidesService: GuidesService
  ) {}

  ngOnInit() {
    const guideUPN$ = this.route.paramMap.pipe(
      map((params: ParamMap) => atob(params.get('guide')))
    );

    this.heroes$ = guideUPN$.pipe(
      switchMap((upn) => this.guidesService.getGuidesHeroes(upn))
    );

    this.guide$ = guideUPN$.pipe(
      switchMap((upn) => this.guidesService.getGuideDetails(upn))
    );
  }

  confirmDelete(upn) {
    this.guidesService.confirmGuideDelete(upn).subscribe(() => {
      this.snackBar.open('Guide Deleted', '', { duration: 2500 });
      this.router.navigate([`guideMonitor`]);
    });
  }

  encode(upn) {
    return btoa(upn);
  }
}
