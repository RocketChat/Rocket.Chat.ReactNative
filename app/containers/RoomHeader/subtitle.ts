import { STATUS_I18N_KEYS } from '~/definitions';
import I18n from '~/i18n';
import { type IActiveUser } from '~/reducers/activeUsers';

export const getConnectionSubtitle = ({ connecting, connected }: { connecting: boolean; connected: boolean }) => {
	if (connecting) {
		return I18n.t('Connecting');
	}
	if (!connected) {
		return I18n.t('Waiting_for_network');
	}
	return undefined;
};

export const getPresenceLabel = ({ status, statusText }: IActiveUser) => {
	const presenceKey = status ? STATUS_I18N_KEYS[status] : undefined;
	return statusText || (presenceKey ? I18n.t(presenceKey) : undefined);
};

export const joinTypingUsers = (usersTyping: string[]) =>
	usersTyping.join(usersTyping.length === 2 ? ` ${I18n.t('and')} ` : ', ');
