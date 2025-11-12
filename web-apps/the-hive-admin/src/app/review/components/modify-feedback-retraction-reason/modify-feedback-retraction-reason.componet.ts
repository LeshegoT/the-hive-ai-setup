import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, Validators, UntypedFormGroup } from '@angular/forms';
import { CreateContentErrorStateMatcher } from '../../../shared/create-content-error-state-matcher';
import {FeedbackRetractionReasons} from '../feedback-retraction-reasons/feedback-retraction-reasons.component';



@Component({
    selector: 'app-modify-feedback-retraction-reason',
    templateUrl: './modify-feedback-retraction-reason.componet.html',
    styleUrls: ['./modify-feedback-retraction-reason.componet.css'],
    standalone: false
})
export class ModifyFeedbackReasonComponent implements OnInit {
  modifyRetractionReasonForm: UntypedFormGroup;
  error = false;

  @Input() retractionReason: FeedbackRetractionReasons;
  @Output() onSave: EventEmitter<FeedbackRetractionReasons> = new EventEmitter();

  constructor(private formBuilder: UntypedFormBuilder, public matcher: CreateContentErrorStateMatcher) {
    this.modifyRetractionReasonForm = this.formBuilder.group({
      retractionReasonID: [{ value: null, disabled: true }, Validators.compose([Validators.required])],
      retractionReason: ['', Validators.compose([Validators.required])],
    });
  }

  ngOnInit() {
    this.setFormValues();
  }

  setFormValues() {
    if (this.retractionReason) {
      for (const prop in this.retractionReason) {
        if (this.modifyRetractionReasonForm.controls[prop])
          this.modifyRetractionReasonForm.controls[prop].setValue(this.retractionReason[prop]);
      }
    }
  }

  modifyFeedbackRetractionReasons() {
    if (this.modifyRetractionReasonForm.valid) {
      this.error = false;
      const formValue = this.modifyRetractionReasonForm.getRawValue();
      const { retractionReason, retractionReasonID } = formValue;
      const updatedReason: FeedbackRetractionReasons = {
        retractionReasonID,
        retractionReason,
      };
      this.onSave.emit(updatedReason);
    } else {
      this.error = true;
    }
  }
}
