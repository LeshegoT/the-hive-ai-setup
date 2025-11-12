import { Component, Input, OnInit, SimpleChanges, OnChanges } from '@angular/core';
import { Observable,  Subscription } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { TableService } from '../../../services/table.service';
import { AdditionalInfo, StaffAdditionalInfoService } from '../../../staff/services/staff-additional-info-service';
import { CommonModule } from '@angular/common';
import { MatSpinner } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-staff-additional-info',
    templateUrl: './staff-additional-info.component.html',
    styleUrls: ['./staff-additional-info.component.css'],
    imports: [
      CommonModule,
      MatSpinner,
    ]
})
export class StaffAdditionalInfoComponent implements OnInit, OnChanges {
  private data$ = new Subscription();

  @Input()
  upn: string|undefined;

  userHasAdditionalInfoRights: Observable<boolean>;
  additionalInfo$ :Observable<AdditionalInfo>;

  constructor(
    public tableService: TableService,
    private readonly staffAdditionalInfoService: StaffAdditionalInfoService,
    private readonly authService: AuthService
    ) {}

  ngOnInit() {
    this.userHasAdditionalInfoRights = this.authService.loggedInUserHasAdditonalInfoRights()
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes['upn'] && (changes['upn'].isFirstChange())){
      this.additionalInfo$ = this.staffAdditionalInfoService.fetchAdditionalInfo(this.upn).pipe(shareReplay(1));
    }
  }

  toggleFlag(flag: boolean){
    this.additionalInfo$.pipe(
        switchMap(info => this.staffAdditionalInfoService.toggleFlag(this.upn , info, flag))
      ).subscribe(
        (_infoUpdate) => {
          this.additionalInfo$ = this.staffAdditionalInfoService.fetchAdditionalInfo(this.upn).pipe(shareReplay(1));
        }
      );
  }
}
