import React from 'react';
import { PropTypes, RefreshControl, Keyboard } from 'react-native';
import { Q } from '@nozbe/watermelondb';
import { withSafeAreaInsets } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import { FlatList } from 'react-native-gesture-handler';
import { dequal } from 'dequal';
import { HeaderBackButton } from '@react-navigation/stack';

import StatusBar from '../containers/StatusBar';
import RoomHeaderView from './RoomView/Header';
import { withTheme } from '../theme';
import SearchHeader from './ThreadMessagesView/SearchHeader';
import log, { logEvent } from '../utils/log';
import database from '../lib/database';
import { FILTER } from './ThreadMessagesView/filters';
import { getUserSelector } from '../selectors/login';
import { getHeaderTitlePosition } from '../containers/Header';
import * as HeaderButton from '../containers/HeaderButton';
import NoDataFound from '../containers/NoDataFound';
import SafeAreaView from '../containers/SafeAreaView';
import ActivityIndicator from '../containers/ActivityIndicator';
import RoomItem, { ROW_HEIGHT } from '../presentation/RoomItem';
import RocketChat from '../lib/rocketchat';
import { withDimensions } from '../dimensions';
import { isIOS, isTablet } from '../utils/deviceInfo';
import { themes } from '../constants/colors';
import debounce from '../utils/debounce';
import { showErrorAlert } from '../utils/info';

const API_FETCH_COUNT = 10; // FIXME: 50
const INITIAL_NUM_TO_RENDER = isTablet ? 20 : 12;

const getItemLayout = (data, index) => ({
	length: ROW_HEIGHT,
	offset: ROW_HEIGHT * index,
	index
});
const keyExtractor = item => item._id;

class TeamChannelsView extends React.Component {
	constructor(props) {
		super(props);
		this.rid = props.route.params?.rid;
		this.t = props.route.params?.t;
		this.teamId = props.route.params?.teamId;
		this.state = {
			loading: true,
			loadingMore: false,
			data: [],
			total: -1,
			isSearching: false,
			searchText: '',
			search: []
		};
		this.loadTeam();
	}

	componentDidMount() {
		this.load();
	}

	loadTeam = async() => {
		const db = database.active;
		try {
			const subCollection = db.get('subscriptions');
			[this.team] = await subCollection.query(
				Q.where('team_id', Q.eq(this.teamId)),
				Q.where('team_main', Q.eq(true))
			);
			this.setHeader();
		} catch {
			// TODO: test me
			const { navigation } = this.props;
			navigation.pop();
			showErrorAlert('Couldn\'t find team');
		}
	}

	// shouldComponentUpdate(nextProps, nextState) {
	// 	const { data } = this.state
	// 	if (!dequal(nextProps.data, data)) {
	// 		return true;
	// 	}
	// }

	getHeader = () => {
		const { isSearching } = this.state;
		const {
			navigation, isMasterDetail, insets, route, theme
		} = this.props;

		const { team } = this;
		if (!team) {
			return;
		}

		const headerTitlePosition = getHeaderTitlePosition({ insets, numIconsRight: 1 });

		if (isSearching) {
			return {
				headerTitleAlign: 'left',
				headerLeft: () => (
					<HeaderButton.Container left>
						<HeaderButton.Item
							iconName='close'
							onPress={this.cancelSearch}
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
			headerTitle: () => (
				<RoomHeaderView
					title={RocketChat.getRoomTitle(team)}
					subtitle={team.topic}
					type={team.t}
					goRoomActionsView={this.goRoomActionsView}
					teamMain
				/>
			)
		};

		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} />;
		} else {
			options.headerLeft = () => (
				<HeaderBackButton
					labelVisible={false}
					onPress={() => navigation.pop()}
					tintColor={themes[theme].headerTintColor}
				/>
			);
		}

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

	onSearchChangeText = debounce((searchText) => {
		this.setState({
			searchText, search: [], loading: !!searchText, loadingMore: false, total: -1
		}, () => {
			if (searchText) {
				this.load();
			}
		});
	}, 300)

	cancelSearch = () => {
		const { isSearching } = this.state;
		if (!isSearching) {
			return;
		}
		Keyboard.dismiss();
		this.setState({ isSearching: false, search: [] }, () => {
			this.setHeader();
		});
	};

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

	load = debounce(async() => {
		const {
			loadingMore, total, data, search, isSearching, searchText
		} = this.state;

		const length = isSearching ? search.length : data.length;
		if (loadingMore || length === total) {
			return;
		}

		this.setState({ loadingMore: true });
		try {
			const result = await RocketChat.getTeamListRoom({
				teamId: this.teamId,
				offset: length,
				count: API_FETCH_COUNT,
				type: 'all',
				filter: searchText
			});

			if (result.success) {
				const newState = {
					loading: false,
					loadingMore: false,
					total: result.total
				};
				if (isSearching) {
					newState.search = [...search, ...result.rooms];
				} else {
					newState.data = [...data, ...result.rooms];
				}

				this.setState(newState);
			} else {
				this.setState({ loading: false, loadingMore: false });
			}
		} catch (e) {
			log(e);
			this.setState({ loading: false, loadingMore: false });
		}
	}, 200)

	getRoomTitle = item => RocketChat.getRoomTitle(item)

	getRoomAvatar = item => RocketChat.getRoomAvatar(item)

	// onPressItem = (item = {}) => {
	// 	const { navigation, isMasterDetail } = this.props;
	// 	if (!navigation.isFocused()) {
	// 		return;
	// 	}

	// 	this.cancelSearch();
	// 	this.goRoom({ item, isMasterDetail });
	// };

	renderItem = ({ item }) => {
		const {
			// StoreLastMessage,
			useRealName,
			theme,
			isMasterDetail,
			width
		} = this.props;
		return (
			<RoomItem
				item={item}
				theme={theme}
				type={item.t}
				// showLastMessage={StoreLastMessage}
				onPress={this.onPressItem}
				width={width}
				useRealName={useRealName}
				getRoomTitle={this.getRoomTitle}
				getRoomAvatar={this.getRoomAvatar}
				swipeEnabled={false}
			/>
		);
	};

	renderFooter = () => {
		const { loadingMore } = this.state;
		const { theme } = this.props;
		if (loadingMore) {
			return <ActivityIndicator theme={theme} />;
		}
		return null;
	}

	renderScroll = () => {
		const {
			loading, data, search, isSearching, searchText
		} = this.state;
		const { theme } = this.props;

		if (loading) {
			return <ActivityIndicator theme={theme} />;
		}

		if ((isSearching && searchText && !search.length) || (!isSearching && !data.length)) {
			return <NoDataFound text='There are no channels' />;
		}

		return (
			<FlatList
				data={isSearching ? search : data}
				extraData={isSearching ? search : data}
				keyExtractor={keyExtractor}
				renderItem={this.renderItem}
				getItemLayout={getItemLayout}
				removeClippedSubviews={isIOS}
				keyboardShouldPersistTaps='always'
				// initialNumToRender={INITIAL_NUM_TO_RENDER}
				// windowSize={9}
				onEndReached={() => this.load()}
				onEndReachedThreshold={0.5}
				ListFooterComponent={this.renderFooter}
			/>
		);
	};

	render() {
		console.count(`${ this.constructor.name }.render calls`);
		return (
			<SafeAreaView testID='team-channels-view'>
				<StatusBar />
				{this.renderScroll()}
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.server.server,
	user: getUserSelector(state),
	useRealName: state.settings.UI_Use_Real_Name,
	isMasterDetail: state.app.isMasterDetail,
	StoreLastMessage: state.settings.Store_Last_Message
});

export default connect(mapStateToProps)(withDimensions(withSafeAreaInsets(withTheme(TeamChannelsView))));
