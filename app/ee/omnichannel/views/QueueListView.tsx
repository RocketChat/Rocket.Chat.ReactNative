import React, { useEffect, useRef } from 'react';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationOptions, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, ListRenderItem } from 'react-native';
import { shallowEqual, useSelector } from 'react-redux';

import I18n from '../../../i18n';
import RoomItem, { ROW_HEIGHT } from '../../../containers/RoomItem';
import { getUserSelector } from '../../../selectors/login';
import { useTheme } from '../../../theme';
import { useDimensions } from '../../../dimensions';
import SafeAreaView from '../../../containers/SafeAreaView';
import StatusBar from '../../../containers/StatusBar';
import { goRoom } from '../../../lib/methods/helpers/goRoom';
import * as HeaderButton from '../../../containers/HeaderButton';
import { events, logEvent } from '../../../lib/methods/helpers/log';
import { getInquiryQueueSelector } from '../selectors/inquiry';
import { IOmnichannelRoom, IApplicationState } from '../../../definitions';
import { MAX_SIDEBAR_WIDTH } from '../../../lib/constants';
import { ChatsStackParamList } from '../../../stacks/types';
import { MasterDetailInsideStackParamList } from '../../../stacks/MasterDetailStack/types';
import { getRoomAvatar, getRoomTitle, getUidDirectMessage, isIOS, isTablet } from '../../../lib/methods/helpers';

type TNavigation = CompositeNavigationProp<
	NativeStackNavigationProp<ChatsStackParamList, 'QueueListView'>,
	NativeStackNavigationProp<MasterDetailInsideStackParamList>
>;

const INITIAL_NUM_TO_RENDER = isTablet ? 20 : 12;
const getItemLayout = (data: ArrayLike<IOmnichannelRoom> | null | undefined, index: number) => ({
	length: ROW_HEIGHT,
	offset: ROW_HEIGHT * index,
	index
});
const keyExtractor = (item: IOmnichannelRoom) => item.rid;

const QueueListView = React.memo(() => {
	const navigation = useNavigation<TNavigation>();
	const getScrollRef = useRef<FlatList<IOmnichannelRoom>>(null);
	const { colors } = useTheme();
	const { width } = useDimensions();

	const { username } = useSelector(
		(state: IApplicationState) => ({
			userId: getUserSelector(state).id,
			username: getUserSelector(state).username,
			token: getUserSelector(state).token
		}),
		shallowEqual
	);

	const { showAvatar, displayMode } = useSelector(
		(state: IApplicationState) => ({
			showAvatar: state.sortPreferences.showAvatar,
			displayMode: state.sortPreferences.displayMode
		}),
		shallowEqual
	);

	const isMasterDetail = useSelector((state: IApplicationState) => state.app.isMasterDetail);
	const useRealName = useSelector((state: IApplicationState) => state.settings.UI_Use_Real_Name);
	const queued = useSelector((state: IApplicationState) => getInquiryQueueSelector(state));

	useEffect(() => {
		const options: NativeStackNavigationOptions = {
			title: I18n.t('Queued_chats')
		};
		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} testID='directory-view-close' />;
		}
		navigation.setOptions(options);
	}, [isMasterDetail, navigation]);

	const onPressItem = (item = {} as IOmnichannelRoom) => {
		logEvent(events.QL_GO_ROOM);
		goRoom({
			item: {
				...item,
				// we're calling v as visitor on our mergeSubscriptionsRooms
				visitor: item.v
			},
			isMasterDetail,
			popToRoot: true
		});
	};

	const renderItem: ListRenderItem<IOmnichannelRoom> = ({ item }) => {
		const id = getUidDirectMessage(item);
		return (
			<RoomItem
				item={item}
				id={id}
				username={username}
				onPress={onPressItem}
				width={isMasterDetail ? MAX_SIDEBAR_WIDTH : width}
				useRealName={!!useRealName}
				getRoomTitle={getRoomTitle}
				getRoomAvatar={getRoomAvatar}
				swipeEnabled={false}
				showAvatar={showAvatar}
				displayMode={displayMode}
			/>
		);
	};

	return (
		<SafeAreaView testID='queue-list-view' style={{ backgroundColor: colors.surfaceRoom }}>
			<StatusBar />
			<FlatList
				ref={getScrollRef}
				data={queued}
				extraData={queued}
				keyExtractor={keyExtractor}
				style={{ backgroundColor: colors.surfaceRoom }}
				renderItem={renderItem}
				getItemLayout={getItemLayout}
				removeClippedSubviews={isIOS}
				keyboardShouldPersistTaps='always'
				initialNumToRender={INITIAL_NUM_TO_RENDER}
				windowSize={9}
				onEndReachedThreshold={0.5}
			/>
		</SafeAreaView>
	);
});

export default QueueListView;
