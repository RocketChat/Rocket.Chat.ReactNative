import I18n from '../../../i18n';
import EventEmitter from '../../../lib/methods/helpers/events';
import log from '../../../lib/methods/helpers/log';
import { toggleFollowMessage } from '../../../lib/services/restApi';
import { LISTENER } from '../../../containers/Toast';

export const toggleFollowThread = async (threadMessageId: string, isFollowingThread: boolean): Promise<void> => {
	try {
		await toggleFollowMessage(threadMessageId, !isFollowingThread);
		EventEmitter.emit(LISTENER, { message: isFollowingThread ? I18n.t('Unfollowed_thread') : I18n.t('Following_thread') });
	} catch (e) {
		log(e);
	}
};
