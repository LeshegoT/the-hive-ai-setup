import sinon from 'sinon';
import message_service from '../../../../src/services/message.service';

export const createMessage_stub = sinon.stub(message_service, 'createMessage');