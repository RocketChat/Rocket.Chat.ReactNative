import React, { memo, useCallback, useLayoutEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { shallowEqual } from 'react-redux';

import ActivityIndicator from '../../containers/ActivityIndicator';
import BackgroundContainer from '../../containers/BackgroundContainer';
import RoomItem from '../../containers/RoomItem';
import { type IRoomItem } from '../../containers/RoomItem/interfaces';
import i18n from '../../i18n';
import { MAX_SIDEBAR_WIDTH } from '../../lib/constants/tablet';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { getRoomAvatar, getRoomTitle, getUidDirectMessage, isIOS } from '../../lib/methods/helpers';
import { goRoom } from '../../lib/methods/helpers/goRoom';
import { useDebounce } from '../../lib/methods/helpers/debounce';
import { search as searchMethod } from '../../lib/methods/search';
import { getUserSelector } from '../../selectors/login';
import { useTheme } from '../../theme';

const SearchView = memo(function SearchView() {
	'use memo';

	const [results, setResults] = useState<IRoomItem[]>([]);
	const [searching, setSearching] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);
	const navigation = useNavigation<any>();
	const { colors } = useTheme();
	const username = useAppSelector(state => getUserSelector(state).username);
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name) as boolean;
	const showLastMessage = useAppSelector(state => state.settings.Store_Last_Message) as boolean;
	const { displayMode, showAvatar } = useAppSelector(state => state.sortPreferences, shallowEqual);
	const { width } = useSafeAreaFrame();
	const subscribedRoom = useAppSelector(state => state.room.subscribedRoom);

	const handleSearch = useDebounce(async (text: string) => {
		if (!text.trim()) {
			setResults([]);
			setSearching(false);
			setHasSearched(false);
			return;
		}
		setSearching(true);
		setHasSearched(true);
		const result = await searchMethod({ text });
		setResults(result as IRoomItem[]);
		setSearching(false);
	}, 300);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerSearchBarOptions: {
				onChangeText: (e: { nativeEvent: { text: string } }) => {
					handleSearch(e.nativeEvent.text);
				},
				placeholder: i18n.t('Search'),
				autoCapitalize: 'none',
				hideWhenScrolling: false
			}
		});
	}, [navigation, handleSearch]);

	const onPressItem = useCallback(
		(item = {} as IRoomItem) => {
			goRoom({ item, isMasterDetail });
		},
		[isMasterDetail]
	);

	const renderItem = useCallback(
		({ item }: { item: IRoomItem }) => {
			const id = item.t === 'd' ? item._id : getUidDirectMessage(item);
			return (
				<RoomItem
					item={item}
					id={id}
					username={username}
					showLastMessage={showLastMessage}
					onPress={onPressItem}
					width={isMasterDetail ? MAX_SIDEBAR_WIDTH : width}
					useRealName={useRealName}
					getRoomTitle={getRoomTitle}
					getRoomAvatar={getRoomAvatar}
					getIsRead={() => true}
					isFocused={subscribedRoom === item.rid}
					swipeEnabled={false}
					showAvatar={showAvatar}
					displayMode={displayMode}
				/>
			);
		},
		[username, showLastMessage, onPressItem, isMasterDetail, width, useRealName, subscribedRoom, showAvatar, displayMode]
	);

	if (searching) {
		return <ActivityIndicator />;
	}

	if (hasSearched && results.length === 0) {
		return <BackgroundContainer text={i18n.t('No_rooms_found')} />;
	}

	if (!hasSearched) {
		return <BackgroundContainer text={i18n.t('Search')} />;
	}

	return (
		<FlatList
			data={results}
			keyExtractor={item => item.rid || item._id}
			renderItem={renderItem}
			style={{ backgroundColor: colors.surfaceRoom }}
			keyboardShouldPersistTaps='always'
			keyboardDismissMode={isIOS ? 'on-drag' : 'none'}
		/>
	);
});

export default SearchView;
