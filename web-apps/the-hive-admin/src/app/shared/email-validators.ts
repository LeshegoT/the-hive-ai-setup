const emailFormat = /^[\w.!#$%&'*+/=?^_`{|}~-]{1,64}@[\w-]+(?:\.[\w-]+)+$/;
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { isBBDEmail } from '@the-hive/lib-shared';


export const BBD_EMAIL_ERROR = "bbdEmail"
export function isValidEmail(email: string) {
  return emailFormat.test(email);
}

export function nonBbdEmailValidator(bbdEmailDomains: string[]) {
  return (control: AbstractControl): ValidationErrors | undefined => {
    const value = control.value;
    if (!value) {
        return undefined;
    } else {
        if (isBBDEmail(value, bbdEmailDomains)) {
            return { [BBD_EMAIL_ERROR]: true };
        } else {
            return undefined;
        }
    }
  };
}
