import { Directive, HostListener } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { NgControl } from '@angular/forms';

@Directive({
    selector: 'input[matDatepicker][formControlName]',
    providers: [MatTooltip],
    standalone: false
})
export class LongDateConversionDirective {

  constructor(
    private ngControl: NgControl,
    private tooltip: MatTooltip
  ) { }

  @HostListener('mouseover') onMouseOver() {
    const controlValue = this.ngControl.control.value;

    if (controlValue instanceof Date) {
      const dateLong = new Intl.DateTimeFormat(navigator.language, { dateStyle: 'long' }).format(controlValue);
      this.tooltip.message = dateLong;
      this.tooltip.show();
    } else {
      //Do do nothing if form control value is not of date type
    }
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.tooltip.hide();
  }
}
