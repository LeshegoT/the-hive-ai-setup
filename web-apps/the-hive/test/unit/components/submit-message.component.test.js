import { html, fixture, expect } from '@open-wc/testing';
import sinon from 'sinon';

import '../../../src/components/submit-message.component';
import missions_service from '../../../src/services/missions.service';
import {
  createMessage_stub
} from '../shared/stubs/message.service.stub';
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
        <e-submit-message></e-submit-message>
      `
    );

    expect(el).to.be.ok;
  });

  it('should call window.history.back when back is called', async () => {
    let el = await fixture(
      html`
        <e-submit-message></e-submit-message>
      `
    );

    let back_stub = sinon.stub(window.history, 'back');

    el.back();

    expect(back_stub.called).to.be.ok;
  });

  it('should stop call to createMessage there is no comment', async () => {
    let el = await fixture(
      html`
        <e-submit-message></e-submit-message>
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

    await el.submit(fake);

    expect(createMessage_stub.called).to.not.be.ok;
  });

  it('should call createMessage when submit is called', async () => {
    let hero = 'test@bbd.co.za';
    let comment = 'Something';
    let messageTypeId = 5;

    let el = await fixture(
      html`
        <e-submit-message></e-submit-message>
      `
    );
    el.hero = hero;
    let messageTypes = [{
      messageTypeId,
      code: 'conversation',
      selfDirected: false,
      contentMediaTypeId: undefined,
    }];
    el.messageType = el.getMessageType(messageTypes);

    let fake = {
      preventDefault: function () {},
      target: {
        comment: {
          value: comment,
        },
        reset: function () {},
      },
    };

    await el.submit(fake);

    expect(
      createMessage_stub.calledWith(
        hero,
        comment,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        messageTypeId,
      )
    ).to.be.ok;
  });

  it('should call createMessage when submit is called with mission', async () => {
    let hero = 'test@bbd.co.za';
    let comment = 'Something';
    let messageTypeId = 2;

    let mission = { missionId: 1 };

    let el = await fixture(
      html`
        <e-submit-message .mission="${mission}"></e-submit-message>
      `
    );
    el.hero = hero;
    let messageTypes = [
      {
        messageTypeId,
        code: 'mission',
        selfDirected: false,
        contentMediaTypeId: 0,
      },
      {
        messageTypeId: 5,
        code: 'conversation',
        selfDirected: false,
        contentMediaTypeId: undefined,
      },
    ];
    el.messageType = el.getMessageType(messageTypes);

    let fake = {
      preventDefault: function() {},
      target: {
        comment: {
          value: comment
        },
        reset: function() {}
      }
    };

    await el.submit(fake);

    expect(el.mission).to.be.ok;
    expect(
      createMessage_stub.calledWith(
        hero,
        comment,
        undefined,
        undefined,
        mission.missionId,
        undefined,
        undefined,
        messageTypeId,
      )
    ).to.be.ok;
  });

  it('should call createMessage and completeMission when submit is called with complete mission', async () => {
    let completeMission_stub = sinon.stub(missions_service, 'completeMission');
    let mission = { missionId: 1, type: { missionTypeId: 1 }, multiplier: 1 };
    let messageTypeId = 2;

    let el = await fixture(
      html`
        <e-submit-message .mission="${mission}"></e-submit-message>
      `
    );

    let fake = {
      preventDefault: function() {},
      target: {
        comment: {
          value: 'comment'
        },
        complete: {
          checked: true
        },
        reset: function() {}
      }
    };

    let messageTypes = [
      {
        messageTypeId,
        code: 'mission',
        selfDirected: false,
        contentMediaTypeId: 0,
      },
      {
        messageTypeId: 5,
        code: 'conversation',
        selfDirected: false,
        contentMediaTypeId: undefined,
      },
    ];
    el.messageType = el.getMessageType(messageTypes);
    
    await el.submit(fake);
    expect(el.mission).to.be.ok;
    expect(createMessage_stub.called).to.be.ok;
    expect(completeMission_stub.calledWith(mission.missionId)).to.be.ok;
    expect(navigate_stub.called).to.be.ok;
  });

  it('should call createMessage when submit is called with course', async () => {
    let hero = 'test@bbd.co.za';
    let comment = 'Something';
    let messageTypeId = 3;

    let course = { courseId: 1 };

    let el = await fixture(
      html`
        <e-submit-message .course="${course}"></e-submit-message>
      `
    );
    el.hero = hero;
    let messageTypes = [
      {
        messageTypeId,
        code: 'course',
        selfDirected: false,
        contentMediaTypeId: 4,
      },
      {
        messageTypeId: 5,
        code: 'conversation',
        selfDirected: false,
        contentMediaTypeId: undefined,
      },
    ];
    el.messageType = el.getMessageType(messageTypes);

    let fake = {
      preventDefault: function() {},
      target: {
        comment: {
          value: comment
        },
        reset: function() {}
      }
    };

    await el.submit(fake);

    expect(el.course).to.be.ok;
    expect(
      createMessage_stub.calledWith(
        hero,
        comment,
        undefined,
        undefined,
        undefined,
        undefined,
        course.courseId,
        messageTypeId,
      )
    ).to.be.ok;
  });

  it ('should call callback when submit is called', async () => {
    let hero = 'test@bbd.co.za';
    let comment = 'Something';
    let messageTypeId = 3;

    let el = await fixture(
      html`
        <e-submit-message></e-submit-message>
      `
    );
    el.hero = hero;
    let messageTypes = [{
      messageTypeId,
      code: 'conversation',
      contentMediaTypeId: undefined,
    }];
    el.messageType = el.getMessageType(messageTypes);
    
    let test = {
      testCallback: function () {}
    }
    let testCallbackStub = sinon.stub(test, 'testCallback')
    el.callback = testCallbackStub;

    let fake = {
      preventDefault: function() {},
      target: {
        comment: {
          value: comment
        },
        reset: function() {}
      }
    };

    await el.submit(fake);
    expect(el).to.be.ok;
    expect(testCallbackStub.called).to.be.ok;
  });
});
