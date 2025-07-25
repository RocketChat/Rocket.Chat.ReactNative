import { LISTENER } from '../../../containers/Toast';
import I18n from '../../../i18n';
import EventEmitter from './events';
import log from './log';
import { Services } from '../../services';

export const handleIgnore = async (userId: string, ignore: boolean, rid: string) => {
	try {
		await Services.ignoreUser({
			rid,
			userId,
			ignore
		});
		const message = I18n.t(ignore ? 'User_has_been_ignored' : 'User_has_been_unignored');
		EventEmitter.emit(LISTENER, { message });
	} catch (e) {
		log(e);
	}
};
