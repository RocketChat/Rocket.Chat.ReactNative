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
import { BASE_ROW_HEIGHT, BASE_ROW_HEIGHT_CONDENSED } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { getRoomAvatar, getRoomTitle, hasNativeHeaderBar, isIOS } from '~/lib/methods/helpers';
import { nativeHeaderContentInset } from '~/lib/methods/helpers/navigation';
import { type ChatsStackParamList } from '~/stacks/types';
import { useChannelActions } from './hooks/useChannelActions';
import { useOpenTeamChannel } from './hooks/useOpenTeamChannel';
import { useTeam } from './hooks/useTeam';
import { useTeamChannels } from './hooks/useTeamChannels';
import { useTeamChannelsHeader } from './hooks/useTeamChannelsHeader';
import { type TTeamChannel } from './types';

const keyExtractor = (item: TTeamChannel) => item._id;

const TeamChannelsView = () => {
	const {
		params: { teamId, joined }
	} = useAppRoute<ChatsStackParamList, 'TeamChannelsView'>();
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

	const onPressItem = useOpenTeamChannel();

	const rowHeight = PixelRatio.roundToNearestPixel(
		(displayMode === DisplayMode.Condensed ? BASE_ROW_HEIGHT_CONDENSED : BASE_ROW_HEIGHT) * PixelRatio.getFontScale()
	);
	const getItemLayout = (_data: ArrayLike<TTeamChannel> | null | undefined, index: number) => ({
		length: rowHeight,
		offset: rowHeight * index,
		index
	});

	const renderItem = ({ item }: { item: TTeamChannel }) => (
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
