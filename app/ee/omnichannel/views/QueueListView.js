import React from 'react';
import PropTypes from 'prop-types';
import { FlatList } from 'react-native';
import { connect } from 'react-redux';
import isEqual from 'react-fast-compare';

import I18n from '../../../i18n';
import RoomItem, { ROW_HEIGHT } from '../../../presentation/RoomItem';
import { MAX_SIDEBAR_WIDTH } from '../../../constants/tablet';
import { isTablet, isIOS } from '../../../utils/deviceInfo';
import { getUserSelector } from '../../../selectors/login';
import { withTheme } from '../../../theme';
import { withDimensions } from '../../../dimensions';
import SafeAreaView from '../../../containers/SafeAreaView';
import { themes } from '../../../constants/colors';
import StatusBar from '../../../containers/StatusBar';
import { goRoom } from '../../../utils/goRoom';
import * as HeaderButton from '../../../containers/HeaderButton';
import RocketChat from '../../../lib/rocketchat';
import { logEvent, events } from '../../../utils/log';
import { getInquiryQueueSelector } from '../selectors/inquiry';

const INITIAL_NUM_TO_RENDER = isTablet ? 20 : 12;
const getItemLayout = (data, index) => ({
	length: ROW_HEIGHT,
	offset: ROW_HEIGHT * index,
	index
});
const keyExtractor = item => item.rid;

class QueueListView extends React.Component {
	static navigationOptions = ({ navigation, isMasterDetail }) => {
		const options = {
			title: I18n.t('Queued_chats')
		};
		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} testID='directory-view-close' />;
		}
		return options;
	}

	static propTypes = {
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			token: PropTypes.string
		}),
		isMasterDetail: PropTypes.bool,
		width: PropTypes.number,
		queued: PropTypes.array,
		server: PropTypes.string,
		useRealName: PropTypes.bool,
		navigation: PropTypes.object,
		theme: PropTypes.string
	}

	shouldComponentUpdate(nextProps) {
		const { queued } = this.props;
		if (!isEqual(nextProps.queued, queued)) {
			return true;
		}

		return false;
	}

	onPressItem = (item = {}) => {
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

	getRoomTitle = item => RocketChat.getRoomTitle(item)

	getRoomAvatar = item => RocketChat.getRoomAvatar(item)

	getUidDirectMessage = room => RocketChat.getUidDirectMessage(room)

	renderItem = ({ item }) => {
		const {
			user: {
				id: userId,
				username,
				token
			},
			server,
			useRealName,
			theme,
			isMasterDetail,
			width
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
				testID={`queue-list-view-item-${ item.name }`}
				width={isMasterDetail ? MAX_SIDEBAR_WIDTH : width}
				useRealName={useRealName}
				getRoomTitle={this.getRoomTitle}
				getRoomAvatar={this.getRoomAvatar}
				visitor={item.v}
				swipeEnabled={false}
			/>
		);
	}

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

const mapStateToProps = state => ({
	user: getUserSelector(state),
	isMasterDetail: state.app.isMasterDetail,
	server: state.server.server,
	useRealName: state.settings.UI_Use_Real_Name,
	queued: getInquiryQueueSelector(state)
});
export default connect(mapStateToProps)(withDimensions(withTheme(QueueListView)));
