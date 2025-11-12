import { html, fixture, expect } from '@open-wc/testing';
import sinon from 'sinon';

import '../../../src/components/submit-self-directed-message.component';
import { createMessage_stub } from '../shared/stubs/message.service.stub';
import { auth_service_stubs } from '../shared/stubs/auth.service.stub';
import { navigate_stub } from '../shared/stubs/navigation.service.stub';

describe('Component - Submit Message', () => {
  auth_service_stubs.uses_select_hero('test@bbd.co.za');

  after(() => {
    navigate_stub.reset();
  });

  afterEach(async () => {
    createMessage_stub.reset();
  });

  it('should initialise properly', async () => {
    let el = await fixture(
      html`
        <e-submit-self-directed-message></e-submit-self-directed-message>
      `
    );

    expect(el).to.be.ok;
  });

  it('should update messageTypeId with new messageTypeId', async () => {
    let el = await fixture(
      html`
        <e-submit-self-directed-message></e-submit-self-directed-message>
      `
    );
    el.types = [{ messageTypeId: 1 }, { messageTypeId: 2 }];
    el.messageTypeId = 1;
    el.messageTypeSelected(2);
    expect(el.messageTypeId).to.equal(2);
  });

  it('should update messageTypeId with 0 if same messageTypeId', async () => {
    let el = await fixture(
      html`
        <e-submit-self-directed-message></e-submit-self-directed-message>
      `
    );
    el.types = [{ messageTypeId: 1 }, { messageTypeId: 2 }];
    el.messageTypeId = 1;
    el.messageTypeSelected(1);
    expect(el.messageTypeId).to.equal(0);
  });

  it('should stop call to createMessage there is no comment', async () => {
    let el = await fixture(
      html`
        <e-submit-self-directed-message></e-submit-self-directed-message>
      `
    );

    let fake = {
      preventDefault: function() {},
      target: {
        comment: {
          value: ''
        },
        reset: function() {}
      }
    };

    el.submit(fake);

    expect(createMessage_stub.called).to.not.be.ok;
  });

  it('should stop call to createMessage there is a messageTypeId but other info is missing', async () => {
    let el = await fixture(
      html`
        <e-submit-self-directed-message></e-submit-self-directed-message>
      `
    );

    let fake = {
      preventDefault: function() {},
      target: {
        comment: {
          value: ''
        },
        dateCompleted: {
          value: ''
        },
        title: {
          value: ''
        },
        link: {
          value: ''
        },
        timeSpent: {
          value: ''
        },
        reset: function() {}
      }
    };
    el.messageTypeId = 1;

    el.submit(fake);

    expect(createMessage_stub.called).to.not.be.ok;
  });

  it('should call createMessage when submit is called', async () => {
    let hero = 'test@bbd.co.za';
    let comment = 'Something';
    let messageTypeId = 5;

    let el = await fixture(
      html`
        <e-submit-self-directed-message></e-submit-self-directed-message>
      `
    );
    el.hero = hero;
    el.messageTypes = [{
      messageTypeId,
      code: 'conversation',
    }];

    let fake = {
      preventDefault: function() {},
      target: {
        comment: {
          value: comment
        },
        dateCompleted: {
          value: ''
        },
        title: {
          value: ''
        },
        link: {
          value: ''
        },
        timeSpent: {
          value: ''
        },
        reset: function() {}
      }
    };

    el.submit(fake);

    expect(
      createMessage_stub.calledWith(
        hero,
        comment,
        false,
        undefined,
        undefined,
        undefined,
        undefined,
        messageTypeId,
        undefined,
      )
    ).to.be.ok;
  });

  it('should call createMessage when submit is called with learning task', async () => {
    let hero = 'test@bbd.co.za';
    let comment = 'Something';
    let messageTypeId = 8;
    let learningTask = {
      dateCompleted: '2020-01-01',
      title: 'test Title',
      link: 'test-link.com',
      timeSpent: 3
    };

    let el = await fixture(
      html`
        <e-submit-self-directed-message></e-submit-self-directed-message>
      `
    );
    el.hero = hero;
    el.messageTypeId = messageTypeId;
    el.messageTypes = [{
      messageTypeId,
      code: 'conversation',
    }];

    let fake = {
      preventDefault: function() {},
      target: {
        comment: {
          value: comment
        },
        dateCompleted: {
          value: '2020-01-01'
        },
        title: {
          value: 'test Title'
        },
        link: {
          value: 'test-link.com'
        },
        timeSpent: {
          value: 3
        },
        reset: function() {}
      }
    };

    el.submit(fake);

    expect(
      createMessage_stub.calledWith(
        hero,
        comment,
        false,
        undefined,
        undefined,
        undefined,
        undefined,
        messageTypeId,
        learningTask,
      )
    ).to.be.ok;
  });
});
