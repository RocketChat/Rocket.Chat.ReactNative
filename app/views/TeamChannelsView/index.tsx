import { FlatList, PixelRatio, useWindowDimensions } from 'react-native';
import { shallowEqual } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ActivityIndicator from '~/containers/ActivityIndicator';
import BackgroundContainer from '~/containers/BackgroundContainer';
import RoomItem from '~/containers/RoomItem';
import SafeAreaView from '~/containers/SafeAreaView';
import I18n from '~/i18n';
import { DisplayMode } from '~/lib/constants/constantDisplayMode';
import { useAppRoute } from '~/lib/hooks/navigation';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { BASE_ROW_HEIGHT, BASE_ROW_HEIGHT_CONDENSED } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { getRoomAvatar, getRoomTitle, hasNativeHeaderBar, isIOS, useDebounce } from '~/lib/methods/helpers';
import { goRoom } from '~/lib/methods/helpers/goRoom';
import { showErrorAlert } from '~/lib/methods/helpers/info';
import { events, logEvent } from '~/lib/methods/helpers/log';
import { nativeHeaderContentInset } from '~/lib/methods/helpers/navigation';
import { getRoomInfo } from '~/lib/services/restApi';
import { type ChatsStackParamList } from '~/stacks/types';
import { useChannelActions } from './hooks/useChannelActions';
import { useTeam } from './hooks/useTeam';
import { type IItem, useTeamChannels } from './hooks/useTeamChannels';
import { useTeamChannelsHeader } from './hooks/useTeamChannelsHeader';

export { type IItem } from './hooks/useTeamChannels';

const keyExtractor = (item: IItem) => item._id;

const TeamChannelsView = () => {
	const {
		params: { teamId, joined }
	} = useAppRoute<ChatsStackParamList, 'TeamChannelsView'>();
	const isMasterDetail = useMasterDetail();
	const { width } = useWindowDimensions();
	const { bottom } = useSafeAreaInsets();
	const { useRealName, StoreLastMessage, showAvatar, displayMode } = useAppSelector(
		state => ({
			useRealName: state.settings.UI_Use_Real_Name as boolean,
			StoreLastMessage: state.settings.Store_Last_Message as boolean,
			showAvatar: state.sortPreferences.showAvatar,
			displayMode: state.sortPreferences.displayMode
		}),
		shallowEqual
	);

	const team = useTeam(teamId);
	const {
		list,
		loading,
		loadingMore,
		isSearching,
		loadMore,
		startSearch,
		cancelSearch,
		onSearchChangeText,
		updateItem,
		removeItem
	} = useTeamChannels(teamId);
	useTeamChannelsHeader({ team, teamId, joined, isSearching, startSearch, cancelSearch, onSearchChangeText });
	const showChannelActions = useChannelActions({ team, updateItem, removeItem });

	const onPressItem = useDebounce(
		async (item: IItem) => {
			logEvent(events.TC_GO_ROOM);
			try {
				let params = {};
				const result = await getRoomInfo(item._id);
				if (result.success) {
					params = {
						rid: item._id,
						name: getRoomTitle(result.room),
						joinCodeRequired: result.room.joinCodeRequired,
						t: result.room.t,
						teamId: result.room.teamId
					};
				}
				goRoom({ item: params, isMasterDetail });
			} catch (e: any) {
				showErrorAlert(e.data.error === 'not-allowed' ? I18n.t('error-not-allowed') : e.data.error);
			}
		},
		1000,
		{ leading: true, trailing: false }
	);

	const rowHeight = PixelRatio.roundToNearestPixel(
		(displayMode === DisplayMode.Condensed ? BASE_ROW_HEIGHT_CONDENSED : BASE_ROW_HEIGHT) * PixelRatio.getFontScale()
	);
	const getItemLayout = (_data: ArrayLike<IItem> | null | undefined, index: number) => ({
		length: rowHeight,
		offset: rowHeight * index,
		index
	});

	const renderItem = ({ item }: { item: IItem }) => (
		<RoomItem
			item={item}
			showLastMessage={StoreLastMessage}
			onPress={onPressItem}
			width={width}
			onLongPress={showChannelActions}
			useRealName={useRealName}
			getRoomTitle={getRoomTitle}
			getRoomAvatar={getRoomAvatar}
			swipeEnabled={false}
			autoJoin={item.teamDefault}
			showAvatar={showAvatar}
			displayMode={displayMode}
		/>
	);

	const renderScroll = () => {
		if (loading) {
			return <BackgroundContainer loading />;
		}
		if (!list.length) {
			return <BackgroundContainer text={I18n.t('No_channels_in_team')} />;
		}
		return (
			<FlatList
				data={list}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				getItemLayout={getItemLayout}
				removeClippedSubviews={isIOS}
				contentInsetAdjustmentBehavior={nativeHeaderContentInset}
				keyboardShouldPersistTaps='always'
				onEndReached={loadMore}
				onEndReachedThreshold={0.5}
				contentContainerStyle={{ paddingBottom: hasNativeHeaderBar ? 0 : bottom }}
				ListFooterComponent={loadingMore ? <ActivityIndicator /> : null}
			/>
		);
	};

	return <SafeAreaView testID='team-channels-view'>{renderScroll()}</SafeAreaView>;
};

export default TeamChannelsView;
