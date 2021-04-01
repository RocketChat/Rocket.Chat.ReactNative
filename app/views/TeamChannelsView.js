import React from 'react';
import { PropTypes } from 'react-native';

import { withSafeAreaInsets } from 'react-native-safe-area-context';
import StatusBar from '../containers/StatusBar';
import RoomHeaderView, { LeftButtons } from './RoomView/Header';
import { withTheme } from '../theme';
import SearchHeader from './ThreadMessagesView/SearchHeader';
import log, { logEvent } from '../utils/log';
import database from '../lib/database';
import { Q } from '@nozbe/watermelondb';
import { FILTER } from './ThreadMessagesView/filters';
import { connect } from 'react-redux';
import { getUserSelector } from '../selectors/login';
import { getHeaderTitlePosition } from '../containers/Header';
import * as HeaderButton from '../containers/HeaderButton';
import NoDataFound from '../containers/NoDataFound';
import SafeAreaView from '../containers/SafeAreaView';
import RoomItem from '../presentation/RoomItem/RoomItem';
import RocketChat from '../lib/rocketchat';
import { withDimensions } from '../dimensions';
import { isIOS } from '../utils/deviceInfo';
import { Keyboard } from 'react-native';
import { ActivityIndicator } from 'react-native';
import { RefreshControl } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';


const INITIAL_NUM_TO_RENDER = isTablet ? 20 : 12;

const getItemLayout = (data, index) => ({
	length: ROW_HEIGHT,
	offset: ROW_HEIGHT * index,
	index
});

const keyExtractor = item => item.rid;

class TeamChannelsView extends React.Component {

	constructor(props) {
		super(props);
		this.mounted = false;
		this.rid = props.route.params?.rid;
		this.t = props.route.params?.t;
		this.teamId = props.route.params?.teamId;
		this.state = {
			loading: false,
			end: false,
			chats: [],
			subscription: {},
			isSearching: false,
			searchText: '',
			searching: false,
			search: [],
			refreshing: false
		};
		this.setHeader();
		this.initSubscription();
		this.subscribeChats();
	}

	componentDidMount() {
		this.mounted = true;
	}

	componentWillUnmount() {
		console.countReset(`${ this.constructor.name }.render calls`);
		if (this.subSubscription && this.subSubscription.unsubscribe) {
			this.subSubscription.unsubscribe();
		}
		if (this.chatSubscription && this.chatSubscription.unsubscribe) {
			this.chatSubscription.unsubscribe();
		}
	}

	getHeader = () => {
		const { isSearching } = this.state;
		const {
			navigation, isMasterDetail, insets, route, theme
		} = this.props;

		const {
			tmid, t, title, subtitle, teamMain, parentTitle, unreadsCount
		} = route?.params;


		const headerTitlePosition = getHeaderTitlePosition({ insets, numIconsRight: 1 });

		if (isSearching) {
			return {
				headerTitleAlign: 'left',
				headerLeft: () => (
					<HeaderButton.Container left>
						<HeaderButton.Item
							iconName='close'
							onPress={this.onCancelSearchPress}
						/>
					</HeaderButton.Container>
				),
				headerTitle: () => <SearchHeader onSearchChangeText={this.onSearchChangeText} />,
				headerTitleContainerStyle: {
					left: headerTitlePosition.left,
					right: headerTitlePosition.right
				},
				headerRight: () => null
			};
		}

		const options = {
			headerShown: true,
			headerTitleAlign: 'left',
			headerTitleContainerStyle: {
				left: headerTitlePosition.left,
				right: headerTitlePosition.right
			},
			headerLeft: () => (
				<LeftButtons
					tmid={tmid}
					unreadsCount={unreadsCount}
					navigation={navigation}
					theme={theme}
					t={t}
					goRoomActionsView={this.goRoomActionsView}
					isMasterDetail={isMasterDetail}
				/>
			),
			headerTitle: () => (
				<RoomHeaderView
					title={title}
					teamMain={teamMain}
					parentTitle={parentTitle}
					subtitle={subtitle}
					type={t}
					// roomUserId={roomUserId}
					goRoomActionsView={this.goRoomActionsView}
				/>
			)

		};

		options.headerRight = () => (
			<HeaderButton.Container>
				<HeaderButton.Item iconName='search' onPress={this.onSearchPress} />
			</HeaderButton.Container>
		);
		return options;
	}

	setHeader = () => {
		const { navigation } = this.props;
		const options = this.getHeader();
		navigation.setOptions(options);
	}

	onSearchPress = () => {
		this.setState({ isSearching: true }, () => this.setHeader());
	}

	onCancelSearchPress = () => {
		this.setState({ isSearching: false, searchText: '' }, () => {
			const { subscription } = this.state;
			this.setHeader();
			// this.subscribeMessages(subscription);
		});
	}

	// goRoomActionsView = (screen) => {
	// 	logEvent(events.TEAM_GO_RA);
	// 	const {
	// 		navigation, isMasterDetail, room, rid, t, member
	// 	} = this.props;
	// 	if (isMasterDetail) {
	// 		navigation.navigate('ModalStackNavigator', {
	// 			screen: screen ?? 'RoomActionsView',
	// 			params: {
	// 				rid, t, room, member, showCloseModal: !!screen
	// 			}
	// 		});
	// 	} else {
	// 		navigation.navigate('RoomActionsView', {
	// 			rid, t, room, member
	// 		});
	// 	}
	// }

	initSubscription = async() => {
		try {
			const db = database.active;

			// subscription query
			const subscription = await db.collections
				.get('subscriptions')
				.find(this.teamId);
			const observable = subscription.observe();
			this.subSubscription = observable
				.subscribe((data) => {
					this.setState({ subscription: data });
				});

			this.subscribeChats();
		} catch (e) {
			log(e);
		}
	}

	subscribeChats = (searchText) => {
		try {
			const db = database.active;

			if (this.chatSubscription && this.chatSubscription.unsubscribe) {
				this.chatSubscription.unsubscribe();
			}

			const whereClause = [
				Q.where('team_id', this.teamId),
				Q.where('rid', Q.notEq(this.rid)),
			];

			if (searchText?.trim()) {
				whereClause.push(Q.where('fname', Q.like(`%${ sanitizeLikeString(searchText.trim()) }%`)));
			}

			this.chatsObservable = db.collections
				.get('subscriptions')
				.query(...whereClause)
				.observeWithColumns(['room_updated_at']);
			this.chatSubscription = this.chatsObservable
				.subscribe((chats) => {
					if (this.mounted) {
						this.setState({ chats });
					} else {
						this.state.chats = chats;
					}
				});
		} catch (e) {
			log(e);
		}
	}
	
	getRoomTitle = item => RocketChat.getRoomTitle(item)

	getRoomAvatar = item => RocketChat.getRoomAvatar(item)

	isRead = item => RocketChat.isRead(item)

	getUserPresence = uid => RocketChat.getUserPresence(uid)

	getUidDirectMessage = room => RocketChat.getUidDirectMessage(room);

	onPressItem = (item = {}) => {
		const { navigation, isMasterDetail } = this.props;
		if (!navigation.isFocused()) {
			return;
		}

		this.cancelSearch();
		this.goRoom({ item, isMasterDetail });
	};

	onEndReached = () => {
		this.getSubscriptions();
	}

	toggleFav = async(rid, favorite) => {
		// logEvent(favorite ? events.RL_UNFAVORITE_CHANNEL : events.RL_FAVORITE_CHANNEL);
		try {
			const db = database.active;
			const result = await RocketChat.toggleFavorite(rid, !favorite);
			if (result.success) {
				const subCollection = db.get('subscriptions');
				await db.action(async() => {
					try {
						const subRecord = await subCollection.find(rid);
						await subRecord.update((sub) => {
							sub.f = !favorite;
						});
					} catch (e) {
						log(e);
					}
				});
			}
		} catch (e) {
			// logEvent(events.RL_TOGGLE_FAVORITE_FAIL);
			log(e);
		}
	};

	onRefresh = () => {
		const { searching } = this.state;
		const { roomsRequest } = this.props;
		if (searching) {
			return;
		}
		roomsRequest({ allData: true });
	}

	cancelSearch = () => {
		const { searching } = this.state;
		const { closeSearchHeader } = this.props;

		if (!searching) {
			return;
		}

		Keyboard.dismiss();

		this.setState({ searching: false, search: [] }, () => {
			this.setHeader();
			closeSearchHeader();
			setTimeout(() => {
				this.scrollToTop();
			}, 200);
		});
	};
	z

	renderItem = ({ item }) => {
		if (item.separator) {
			return this.renderSectionHeader(item.rid);
		}

		const { item: currentItem } = this.state;
		const {
			user: { username },
			StoreLastMessage,
			useRealName,
			theme,
			isMasterDetail,
			width
		} = this.props;

		// const id = this.getUidDirectMessage(item);

		return (
			<RoomItem
				item={item}
				theme={theme}
				id={this.rid}
				type={item.t}
				showLastMessage={StoreLastMessage}
				onPress={this.onPressItem}
				width={width}
				// toggleFav={this.toggleFav}
				// toggleRead={this.toggleRead}
				// hideChannel={this.hideChannel}
				getRoomTitle={this.getRoomTitle}
				getRoomAvatar={this.getRoomAvatar}
				// getIsRead={this.isRead}
				// visitor={item.visitor}
				isFocused={currentItem?.rid === item.rid}
			/>
		);
	};

	renderScroll = () => {
		const {
			loading, chats, search, searching
		} = this.state;
		const { theme, refreshing } = this.props;

		if (loading) {
			return <ActivityIndicator theme={theme} />;
		}

		if(!chats.length){
			return  <NoDataFound text='There are no channels' /> 
		}

		return (
			<FlatList
				ref={this.getScrollRef}
				data={searching ? search : chats}
				extraData={searching ? search : chats}
				keyExtractor={keyExtractor}
				style={[styles.list, { backgroundColor: themes[theme].backgroundColor }]}
				renderItem={this.renderItem}
				getItemLayout={getItemLayout}
				removeClippedSubviews={isIOS}
				keyboardShouldPersistTaps='always'
				initialNumToRender={INITIAL_NUM_TO_RENDER}
				// refreshControl={(
				// 	<RefreshControl
				// 		refreshing={refreshing}
				// 		onRefresh={this.onRefresh}
				// 		tintColor={themes[theme].auxiliaryText}
				// 	/>
				// )}
				windowSize={9}
				onEndReached={this.onEndReached}
				onEndReachedThreshold={0.5}
			/>
		);
	};

	render() {
		console.count(`${ this.constructor.name }.render calls`);
		const { chats } = this.state;

		console.log({chats});

		return (
			<SafeAreaView testID='team-channels-view'>
				<StatusBar />
				{this.renderScroll}
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.server.server,
	user: getUserSelector(state),
	useRealName: state.settings.UI_Use_Real_Name,
	isMasterDetail: state.app.isMasterDetail,
	StoreLastMessage: state.settings.Store_Last_Message,
});

export default connect(mapStateToProps)(withDimensions(withSafeAreaInsets(withTheme(TeamChannelsView))));
