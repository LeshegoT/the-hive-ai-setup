import { InjectionToken } from '@angular/core';
import { HrReviewDashboardService } from '../review/services/hr-review-dashboard.service';
import { ContractsDashboardService } from '../contracts/services/contracts-dashboard.service';

export const ReviewDashboardServiceToken = new InjectionToken<HrReviewDashboardService | ContractsDashboardService>('ReviewDashboardService');
