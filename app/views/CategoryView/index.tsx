import { type StaticScreenProps } from '@react-navigation/native';
import { FlatList, Platform } from 'react-native';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';
import { shallowEqual } from 'react-redux';

import ActivityIndicator from '~/containers/ActivityIndicator';
import { FLOATING_ACTION_BUTTON_CLEARANCE } from '~/containers/FloatingActionButton';
import RoomItem from '~/containers/RoomItem';
import { type IRoomItem } from '~/containers/RoomItem/interfaces';
import SafeAreaView from '~/containers/SafeAreaView';
import { MAX_SIDEBAR_WIDTH } from '~/lib/constants/tablet';
import { IOS_BACK_SWIPE_EDGE_WIDTH } from '~/lib/constants/gestures';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { getRoomAvatar, getRoomTitle, getUidDirectMessage, isIOS, isRead } from '~/lib/methods/helpers';
import { goRoom } from '~/lib/methods/helpers/goRoom';
import { getUserSelector } from '~/selectors/login';
import { useTheme } from '~/theme';
import NewMessageButton from '~/views/RoomsListView/components/NewMessageButton';
import { useCategoryRooms } from './hooks/useCategoryRooms';
import { useCategoryHeader } from './hooks/useCategoryHeader';
import SectionPills from './components/SectionPills';

export type CategoryViewParams = {
	header: string;
	title: string;
};

const CategoryView = ({ route }: StaticScreenProps<CategoryViewParams>) => {
	const { colors } = useTheme();
	const { header, title } = route.params;
	const { rooms, sections, loading } = useCategoryRooms(header);
	const username = useAppSelector(state => getUserSelector(state).username);
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name) as boolean;
	const showLastMessage = useAppSelector(state => state.settings.Store_Last_Message) as boolean;
	const { displayMode, showAvatar } = useAppSelector(state => state.sortPreferences, shallowEqual);
	const subscribedRoom = useAppSelector(state => state.room.subscribedRoom);
	const isMasterDetail = useMasterDetail();
	const { width } = useSafeAreaFrame();
	const { bottom } = useSafeAreaInsets();
	const { showNewMessageButton, goToNewMessage, selectSection } = useCategoryHeader(header, title);

	const onPressItem = (item = {} as IRoomItem) => {
		if (item.rid === subscribedRoom) {
			return;
		}
		goRoom({ item, isMasterDetail });
	};

	const renderItem = ({ item }: { item: IRoomItem }) => (
		<RoomItem
			item={item}
			id={getUidDirectMessage(item)}
			username={username}
			showLastMessage={showLastMessage}
			onPress={onPressItem}
			width={isMasterDetail ? MAX_SIDEBAR_WIDTH : width}
			useRealName={useRealName}
			getRoomTitle={getRoomTitle}
			getRoomAvatar={getRoomAvatar}
			getIsRead={isRead}
			isFocused={isMasterDetail && subscribedRoom === item.rid}
			swipeEnabled
			navigationSwipeEdgeWidth={isIOS ? IOS_BACK_SWIPE_EDGE_WIDTH : 0}
			showAvatar={showAvatar}
			displayMode={displayMode}
		/>
	);

	if (loading) {
		return <ActivityIndicator />;
	}

	return (
		<SafeAreaView testID='category-view' style={{ backgroundColor: colors.surfaceTint }}>
			<SectionPills sections={sections} selectedHeader={header} onSelect={selectSection} />
			<FlatList
				data={rooms as IRoomItem[]}
				keyExtractor={item => item.rid}
				renderItem={renderItem}
				contentContainerStyle={{
					paddingBottom:
						Platform.select({ ios: 0, default: bottom }) + (showNewMessageButton ? FLOATING_ACTION_BUTTON_CLEARANCE : 0)
				}}
				contentInsetAdjustmentBehavior={isIOS ? 'automatic' : undefined}
			/>
			{showNewMessageButton ? <NewMessageButton onPress={goToNewMessage} /> : null}
		</SafeAreaView>
	);
};

export default CategoryView;
