import I18n from '~/i18n';
import { useAppSelector } from '~/lib/hooks/useAppSelector';

export const useRoomsListSubtitle = (): string | undefined => {
	const supportedVersionsStatus = useAppSelector(state => state.supportedVersions.status);
	const connecting = useAppSelector(state => state.meteor.connecting || state.server.loading || state.login.isFetching);
	const connected = useAppSelector(state => state.meteor.connected);
	const isFetchingRooms = useAppSelector(state => state.rooms.isFetching);
	const server = useAppSelector(state => state.server.server);

	if (supportedVersionsStatus === 'expired') {
		return I18n.t('Cannot_connect');
	}
	if (connecting) {
		return I18n.t('Connecting');
	}
	if (isFetchingRooms) {
		return I18n.t('Updating');
	}
	if (!connected) {
		return I18n.t('Waiting_for_network');
	}
	return server?.replace(/(^\w+:|^)\/\//, '');
};
