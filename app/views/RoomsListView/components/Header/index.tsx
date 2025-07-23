import React from 'react';
import { useDispatch } from 'react-redux';

import { setSearch } from '../../../../actions/rooms';
import Header from './Header';
import { showActionSheetRef } from '../../../../containers/ActionSheet';
import ServersList from '../ServersList';
import { useAppSelector } from '../../../../lib/hooks/useAppSelector';
import { useDebounce } from '../../../../lib/methods/helpers/debounce';

const RoomsListHeaderView = () => {
	const dispatch = useDispatch();
	const showSearchHeader = useAppSelector(state => state.rooms.showSearchHeader);
	const connecting = useAppSelector(state => state.meteor.connecting || state.server.loading);
	const connected = useAppSelector(state => state.meteor.connected);
	const isFetching = useAppSelector(state => state.rooms.isFetching);
	const serverName = useAppSelector(state => state.settings.Site_Name as string);
	const server = useAppSelector(state => state.server.server);

	const onSearchChangeText = useDebounce((text: string) => {
		dispatch(setSearch(text.trim()));
	}, 500);

	const onPress = () => {
		showActionSheetRef({ children: <ServersList />, enableContentPanningGesture: false });
	};

	return (
		<Header
			serverName={serverName}
			server={server}
			showSearchHeader={showSearchHeader}
			connecting={connecting}
			connected={connected}
			isFetching={isFetching}
			onPress={onPress}
			onSearchChangeText={onSearchChangeText}
		/>
	);
};

export default RoomsListHeaderView;
