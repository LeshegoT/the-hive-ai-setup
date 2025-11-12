import sinon from 'sinon';
import notification_service from '../../../../src/services/notification.service';

export const check_for_notifications = sinon.stub(notification_service, 'checkForNotifications');
export const resolve_quest_notifications = sinon.stub(notification_service, 'resolveQuestNotifications');