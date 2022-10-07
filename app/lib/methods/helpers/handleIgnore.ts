import { LISTENER } from '../../../containers/Toast';
import { TUserModel } from '../../../definitions';
import I18n from '../../../i18n';
import EventEmitter from './events';
import log from './log';
import { Services } from '../../services';

export const handleIgnore = async (selectedUser: TUserModel, ignore: boolean, rid: string) => {
	try {
		await Services.ignoreUser({
			rid,
			userId: selectedUser._id,
			ignore
		});
		const message = I18n.t(ignore ? 'User_has_been_ignored' : 'User_has_been_unignored');
		EventEmitter.emit(LISTENER, { message });
	} catch (e) {
		log(e);
	}
};
