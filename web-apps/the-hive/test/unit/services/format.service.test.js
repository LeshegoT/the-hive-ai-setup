import {
  formatDate,
  formatNumericDate,
  formatDateTime,
  formatFullDate,
  formatDateTimeLocale
} from '../../../src/services/format.service';

import { expect } from '@open-wc/testing';

describe('Format service', () => {
  describe('formatDate', () => {
    it('does nothing if the date is undefined.', () => {
      let formatted_date = formatDate();

      expect(formatted_date).to.be.undefined;
    });
  });

  describe('formatNumericDate', () => {
    it('does nothing if the date is undefined.', () => {
      let formatted_date = formatNumericDate();

      expect(formatted_date).to.be.undefined;
    });
  });

  describe('formatDateTime', () => {
    it('does nothing if the date is undefined.', () => {
      let formatted_date = formatDateTime();

      expect(formatted_date).to.be.undefined;
    });
  });

  describe('formatFullDate', () => {
    it('returns undefined when no date is given', () => {
      let formatted_date = formatFullDate();

      expect(formatted_date).to.be.undefined;
    });
  });

   describe('formatDateTimeLocale', () => {
     it('formats the date correctly in a numeric format using locale picked up from user machine', () => {
       let date = new Date('2019/01/01 09:00');

       let formatted_date = formatDateTimeLocale(date);
       let transformeddate = new Date(formatted_date);

       expect(transformeddate.getTimezoneOffset()).to.equal(date.getTimezoneOffset());
     });

     it('does nothing if the date is undefined.', () => {
       let formatted_date = formatDateTimeLocale();

       expect(formatted_date).to.be.undefined;
     });
   });
});
