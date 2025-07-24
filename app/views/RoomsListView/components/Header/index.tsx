import React from 'react';

import Header from './Header';
import { showActionSheetRef } from '../../../../containers/ActionSheet';
import ServersList from '../ServersList';
import { useAppSelector } from '../../../../lib/hooks/useAppSelector';

const RoomsListHeaderView = ({ search, searchEnabled }: { search: (text: string) => void; searchEnabled: boolean }) => {
	const connecting = useAppSelector(state => state.meteor.connecting || state.server.loading);
	const connected = useAppSelector(state => state.meteor.connected);
	const isFetching = useAppSelector(state => state.rooms.isFetching);
	const serverName = useAppSelector(state => state.settings.Site_Name as string);
	const server = useAppSelector(state => state.server.server);

	const onPress = () => {
		showActionSheetRef({ children: <ServersList />, enableContentPanningGesture: false });
	};

	return (
		<Header
			serverName={serverName}
			server={server}
			connecting={connecting}
			connected={connected}
			isFetching={isFetching}
			onPress={onPress}
			search={search}
			searchEnabled={searchEnabled}
		/>
	);
};

export default RoomsListHeaderView;
