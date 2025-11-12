import '../shared/stubs/globals';
import sinon from 'sinon';
import { html, fixture, expect } from '@open-wc/testing';
import '../../../src/components/questions.component';
import question_service from '../../../src/services/question.service';

describe('Component - Questions', () => {
  it('should initialise properly', async () => {
    let questions = [
      {
        questionId: 1,
        answers: [
          { questionId: 1, questionAnswerId: 1 },
          { questionId: 1, questionAnswerId: 2 }
        ],
        userAnswer: { questionId: 1, questionAnswerId: 1 }
      },
      {
        questionId: 2,
        answers: [
          { questionId: 2, questionAnswerId: 1 },
          { questionId: 2, questionAnswerId: 2 }
        ],
        userAnswer: undefined
      }
    ];

    let el = await fixture(
      html`
        <e-questions .questions="${questions}"></e-questions>
      `
    );

    expect(el).to.be.ok;
    expect(el.questions).to.be.ok;
    expect(el.done).to.not.be.ok;
  });

  it('should display done if done', async () => {
    let questions = [
      {
        questionId: 1,
        answers: [
          { questionId: 1, questionAnswerId: 1 },
          { questionId: 1, questionAnswerId: 2 }
        ],
        userAnswer: { questionId: 1, questionAnswerId: 1 }
      },
      {
        questionId: 2,
        answers: [
          { questionId: 2, questionAnswerId: 1 },
          { questionId: 2, questionAnswerId: 2 }
        ],
        userAnswer: { questionId: 2, questionAnswerId: 2 }
      }
    ];

    let el = await fixture(
      html`
        <e-questions .questions="${questions}" done="true"></e-questions>
      `
    );

    expect(el).to.be.ok;
    expect(el.questions).to.be.ok;
    expect(el.done).to.be.ok;
  });

  describe('answerChanged', () => {
    let updateUserAnswer_stub;

    before(() => {
      updateUserAnswer_stub = sinon.stub(question_service, 'updateUserAnswer');
    });

    afterEach(() => {
      updateUserAnswer_stub.reset();
    });

    it('should call answerChanged when user changes answer', async () => {
      let questions = [
        {
          questionId: 1,
          answers: [
            { questionId: 1, questionAnswerId: 1 },
            { questionId: 1, questionAnswerId: 2 }
          ],
          userAnswer: { questionId: 1, questionAnswerId: 1 }
        },
        {
          questionId: 2,
          answers: [
            { questionId: 2, questionAnswerId: 1 },
            { questionId: 2, questionAnswerId: 2 }
          ],
          userAnswer: { questionId: 2, questionAnswerId: 2 }
        }
      ];

      let el = await fixture(
        html`
          <e-questions .questions="${questions}" done="false"></e-questions>
        `
      );

      el.answerChanged({ target: { name: '1', value: '1' } });

      expect(updateUserAnswer_stub.called).to.be.ok;
    });
  });
});
