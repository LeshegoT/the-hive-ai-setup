import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RATIFICATION_ACTION, RatificationAction } from '../../skills/services/skills.service';

interface RatificationActionConfiguration {
  action: RatificationAction;
  tooltip: string;
  icon: string;
  method: string;
}

@Component({
  selector: 'app-ratification-actions',
  templateUrl: './ratification-actions.component.html',
  styleUrls: ['./ratification-actions.component.css','../../shared/shared.css'],
  standalone: true,
  imports: [CommonModule, MatTooltipModule, MatButtonModule, MatIcon],
})
export class RatificationActionsComponent {
  @Input() disabled: boolean;
  @Input() selectedAction: RatificationAction;
  @Input() isAvailableAtRatification?: boolean;
  @Output() ratificationAction = new EventEmitter<RatificationAction>();

  readonly availableAtRatificationActions: RatificationActionConfiguration[] = [
    { action: RATIFICATION_ACTION.accept, tooltip: RATIFICATION_ACTION.accept, icon: 'done_all', method: 'approveAttributeOrInstitution' },
    { action: RATIFICATION_ACTION.reject, tooltip: RATIFICATION_ACTION.reject, icon: 'close', method: 'rejectAttributeOrInstitution' }
  ];

  readonly attributeRatificationAction: RatificationActionConfiguration[] = [
    { action: RATIFICATION_ACTION.changeCanonicalName, tooltip: 'Edit Name', icon: 'edit', method: 'editNameOfAttributeOrInstitution' },
    { action: RATIFICATION_ACTION.merge, tooltip: RATIFICATION_ACTION.merge, icon: 'swap_horiz', method: 'mergeAttributeOrInstitution' }
  ];

  get actions(): RatificationActionConfiguration[] {
    return this.isAvailableAtRatification ? this.availableAtRatificationActions : [...this.availableAtRatificationActions, ...this.attributeRatificationAction];
  }

  onActionClick(action: RatificationAction): void {
    this.ratificationAction.emit(action);
  }

  approveAttributeOrInstitution(): void {
    this.onActionClick(RATIFICATION_ACTION.accept);
  }

  rejectAttributeOrInstitution(): void {
    this.onActionClick(RATIFICATION_ACTION.reject);
  }

  editNameOfAttributeOrInstitution(): void {
    this.onActionClick(RATIFICATION_ACTION.changeCanonicalName);
  }

  mergeAttributeOrInstitution(): void {
    this.onActionClick(RATIFICATION_ACTION.merge);
  }

  cssClassForRatificationAction(ratificationAction: RatificationAction): string {
    if(this.selectedAction === ratificationAction || this.disabled){
      return 'disabled-ratification-action';
    }else if(ratificationAction === RATIFICATION_ACTION.accept){
      return 'accept-action';
    } else if(ratificationAction === RATIFICATION_ACTION.reject){
      return 'reject-action';
    } else if(ratificationAction === RATIFICATION_ACTION.changeCanonicalName){
      return 'change-canonical-name-action';
    } else if(ratificationAction === RATIFICATION_ACTION.merge){
      return 'merge-action';
    } else{
      return 'disabled-ratification-action';
    }
  }
}