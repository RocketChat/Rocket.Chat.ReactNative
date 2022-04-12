import React from 'react';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import { FlatList, ListRenderItem } from 'react-native';
import { connect } from 'react-redux';
import { dequal } from 'dequal';

import I18n from '../../../i18n';
import RoomItem, { ROW_HEIGHT } from '../../../containers/RoomItem';
import { isIOS, isTablet } from '../../../utils/deviceInfo';
import { getUserSelector } from '../../../selectors/login';
import { TSupportedThemes, withTheme } from '../../../theme';
import { withDimensions } from '../../../dimensions';
import SafeAreaView from '../../../containers/SafeAreaView';
import StatusBar from '../../../containers/StatusBar';
import { goRoom } from '../../../utils/goRoom';
import * as HeaderButton from '../../../containers/HeaderButton';
import RocketChat from '../../../lib/rocketchat';
import { events, logEvent } from '../../../utils/log';
import { getInquiryQueueSelector } from '../selectors/inquiry';
import { IOmnichannelRoom, IApplicationState } from '../../../definitions';
import { DisplayMode, MAX_SIDEBAR_WIDTH, themes } from '../../../lib/constants';
import { ChatsStackParamList } from '../../../stacks/types';
import { MasterDetailInsideStackParamList } from '../../../stacks/MasterDetailStack/types';
import { TSettingsValues } from '../../../reducers/settings';

interface INavigationOptions {
	isMasterDetail: boolean;
	navigation: CompositeNavigationProp<
		StackNavigationProp<ChatsStackParamList, 'QueueListView'>,
		StackNavigationProp<MasterDetailInsideStackParamList>
	>;
}

interface IQueueListView extends INavigationOptions {
	user: {
		id: string;
		username: string;
		token: string;
	};
	width: number;
	queued: IOmnichannelRoom[];
	server: string;
	useRealName?: TSettingsValues;
	theme: TSupportedThemes;
	showAvatar: any;
	displayMode: DisplayMode;
}

const INITIAL_NUM_TO_RENDER = isTablet ? 20 : 12;
const getItemLayout = (data: IOmnichannelRoom[] | null | undefined, index: number) => ({
	length: ROW_HEIGHT,
	offset: ROW_HEIGHT * index,
	index
});
const keyExtractor = (item: IOmnichannelRoom) => item.rid;

class QueueListView extends React.Component<IQueueListView, any> {
	private getScrollRef?: React.Ref<FlatList<IOmnichannelRoom>>;

	private onEndReached: ((info: { distanceFromEnd: number }) => void) | null | undefined;

	static navigationOptions = ({ navigation, isMasterDetail }: INavigationOptions) => {
		const options: StackNavigationOptions = {
			title: I18n.t('Queued_chats')
		};
		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} testID='directory-view-close' />;
		}
		return options;
	};

	shouldComponentUpdate(nextProps: IQueueListView) {
		const { queued } = this.props;
		if (!dequal(nextProps.queued, queued)) {
			return true;
		}

		return false;
	}

	onPressItem = (item = {} as IOmnichannelRoom) => {
		logEvent(events.QL_GO_ROOM);
		const { navigation, isMasterDetail } = this.props;
		if (isMasterDetail) {
			navigation.navigate('DrawerNavigator');
		} else {
			navigation.navigate('RoomsListView');
		}

		goRoom({
			item: {
				...item,
				// we're calling v as visitor on our mergeSubscriptionsRooms
				visitor: item.v
			},
			isMasterDetail
		});
	};

	getRoomTitle = (item: IOmnichannelRoom) => RocketChat.getRoomTitle(item);

	getRoomAvatar = (item: IOmnichannelRoom) => RocketChat.getRoomAvatar(item);

	getUidDirectMessage = (room: IOmnichannelRoom) => RocketChat.getUidDirectMessage(room);

	renderItem: ListRenderItem<IOmnichannelRoom> = ({ item }) => {
		const {
			user: { id: userId, username, token },
			server,
			useRealName,
			theme,
			isMasterDetail,
			width,
			showAvatar,
			displayMode
		} = this.props;
		const id = this.getUidDirectMessage(item);

		return (
			<RoomItem
				item={item}
				theme={theme}
				id={id}
				type={item.t}
				userId={userId}
				username={username}
				token={token}
				baseUrl={server}
				onPress={this.onPressItem}
				testID={`queue-list-view-item-${item.name}`}
				width={isMasterDetail ? MAX_SIDEBAR_WIDTH : width}
				useRealName={useRealName}
				getRoomTitle={this.getRoomTitle}
				getRoomAvatar={this.getRoomAvatar}
				visitor={item.v}
				swipeEnabled={false}
				showAvatar={showAvatar}
				displayMode={displayMode}
			/>
		);
	};

	render() {
		const { queued, theme } = this.props;
		return (
			<SafeAreaView testID='queue-list-view' style={{ backgroundColor: themes[theme].backgroundColor }}>
				<StatusBar />
				<FlatList
					ref={this.getScrollRef}
					data={queued}
					extraData={queued}
					keyExtractor={keyExtractor}
					style={{ backgroundColor: themes[theme].backgroundColor }}
					renderItem={this.renderItem}
					getItemLayout={getItemLayout}
					removeClippedSubviews={isIOS}
					keyboardShouldPersistTaps='always'
					initialNumToRender={INITIAL_NUM_TO_RENDER}
					windowSize={9}
					onEndReached={this.onEndReached}
					onEndReachedThreshold={0.5}
				/>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	isMasterDetail: state.app.isMasterDetail,
	server: state.server.server,
	useRealName: state.settings.UI_Use_Real_Name,
	queued: getInquiryQueueSelector(state),
	showAvatar: state.sortPreferences.showAvatar,
	displayMode: state.sortPreferences.displayMode
});

export default connect(mapStateToProps)(withDimensions(withTheme(QueueListView)));
