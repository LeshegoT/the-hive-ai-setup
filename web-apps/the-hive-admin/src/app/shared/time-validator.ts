//TODO: 
//  Alter the custom validator to use an input parameter to check
//  if the validator should update - ie in the case of manage we dont want to update
import { AbstractControl, ValidatorFn } from '@angular/forms';

//Validator to check if the time and date input are valid: ie no past dates allowed
export function TimeValidator(dateToCheck: Date): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        const currentTime = new Date();
        const timeField = control.value; //read time value string
        const isTimeValid = !!(timeField && timeField.length);
        if (isTimeValid) {
            const time = timeField.split(':'); //split into hours and minutes
            dateToCheck.setHours(time[0], time[1], 0);
            return currentTime.getTime() < dateToCheck.getTime() ? null : {   
                "invalidInput": control.value,
                "message": "Date cannot be in the past"
            }; //if the date is in the future, return null, otherwise return ErrorMessage
        } else {
            return { 
                "invalidInput": control.value, 
                "message": "Time field cannot be empty"
            }; //if the time field is invalid/empty
        }
    }
}