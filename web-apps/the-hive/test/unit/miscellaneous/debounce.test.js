import { expect } from '@open-wc/testing';
import { debounce } from '../../../src/debounce';

describe('debounce(callback, debounceTime)', () => {
  let callCount = 0;
  let subject;

  beforeEach(() => {
    callCount = 0;

    const testFunc = () => {
      callCount += 1;
    };

    subject = debounce(testFunc, 100);
  });

  describe('.debounce', () => {
    it('Should call the debounced function once within the debounce time frame', async () => {
      subject.debounced();
      subject.debounced();

      await new Promise((resolve, _reject) => {
        setTimeout(resolve, 200);
      });

      expect(callCount).to.equal(1);
    });
  });

  describe('.resolvePending', () => {
    it('Should execute pending callback immediately', () => {
      subject.debounced();
      subject.resolvePending();
      expect(callCount).to.equal(1);
    });

    it('Should not execute callback once it has been resolved', () => {
      subject.debounced();
      subject.resolvePending();
      subject.resolvePending();
      expect(callCount).to.equal(1);
    });
  });
});
