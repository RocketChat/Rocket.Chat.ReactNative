import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, RefreshControl } from 'react-native';
import { connect } from 'react-redux';
import { Services as RocketChat } from '../../lib/services';
import DirectoryItem from '../../containers/DirectoryItem';
import sharedStyles from '../Styles';
import I18n from '../../i18n';
import SearchBox from '../../containers/SearchBox';
import StatusBar from '../../containers/StatusBar';
import ActivityIndicator from '../../containers/ActivityIndicator';
import * as HeaderButton from '../../containers/HeaderButton';
import { debounce } from '../../lib/methods/helpers/debounce';
import log, { logEvent, events } from '../../lib/methods/helpers/log';
import { CustomIcon } from '../../containers/CustomIcon';
import { withTheme } from '../../theme';
import { themes } from '../../lib/constants';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import { goRoom } from '../../lib/methods/helpers/goRoom';
import RoomTypeIcon from '../../containers/RoomTypeIcon';
import styles from './styles';
import Options from './Options';

class ProfileLibraryView extends React.Component {
	static navigationOptions = ({ navigation, isMasterDetail }) => {
		const options = {
			title: I18n.t('PeerSupporterLibrary')
		};
		if (!isMasterDetail) {
			options.headerLeft = () => (
				<HeaderButton.Drawer
					navigation={navigation}
					testID='profile-library-view-drawer'
				/>
			);
		}
		return options;
	}

	static propTypes = {
		navigation: PropTypes.object,
		baseUrl: PropTypes.string,
		isFederationEnabled: PropTypes.bool,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		}),
		theme: PropTypes.string,
		directoryDefaultView: PropTypes.string,
		isMasterDetail: PropTypes.bool
	};

	constructor(props) {
		super(props);
		this.state = {
			data: [],
			loading: false,
			refreshing: false,
			text: '',
			total: -1,
			numUsersFetched: 0,
			showOptionsDropdown: false,
			globalUsers: true,
			type: props.directoryDefaultView
		};
		this.loadingMore = false;
    	this.threshold = 5;
	}

	onEndReached = () => {
		const { loading, total, searching, numUsersFetched } = this.state;
	
		if (!searching && numUsersFetched < total && !loading) {
			this.load({});
		}
	};

	componentDidMount() {
		this.load({});
		logEvent(events.DIRECTORY_SEARCH_USERS);
	}

	onSearchChangeText = (text) => {
		this.setState({ text });
	}

	load = debounce(async ({ newSearch = false }) => {
		if (newSearch) {
			this.setState({ data: [], total: -1, numUsersFetched: 0, loading: false });
		}
		const {
			loading, text, total, numUsersFetched, data: { length }
		} = this.state;
		if (loading || (numUsersFetched >= total && total !== -1)) {
			return;
		}

		this.setState({ loading: true });

		try {
			const { data, type, globalUsers, numUsersFetched } = this.state;
			const query = { text, type, workspace: globalUsers ? 'all' : 'local' };

			//Returns 50 users based on offset, sorted by name from the directory of ALL users
			const directories = await RocketChat.getDirectory({
				query,
				offset: numUsersFetched,
				count: 50,
				sort: { name: 1 }
			});
			if (directories.success) {
				const combinedResults = [];
				const results = directories.result;

				await Promise.all(results.map(async (item, index) => {
					const user = await RocketChat.getUserInfo(item._id);
					//Only keep users that are Peer Supporters
					if (user.user.roles.includes("Peer Supporter")) {
					  combinedResults.push({ ...item, customFields: user.user.customFields });
					}
				}));

				// Update total number of users in directory, and number fetched (including filtered out users)
				this.setState({
					data: [...data, ...combinedResults],
					loading: false,
					refreshing: false,
					numUsersFetched: numUsersFetched + directories.count,
					total: directories.total
				});
			} else {
				this.setState({ loading: false, refreshing: false });
			}
		} catch (e) {
			log(e);
			this.setState({ loading: false, refreshing: false });
		}
	}, 200)

	search = () => {
		this.load({ newSearch: true });
	}

	changeType = (type) => {
		this.setState({ type, data: [] }, () => this.search());

		if (type === 'users') {
			logEvent(events.DIRECTORY_SEARCH_USERS);
		} else if (type === 'channels') {
			logEvent(events.DIRECTORY_SEARCH_CHANNELS);
		}
	}

	toggleWorkspace = () => {
		this.setState(({ globalUsers }) => ({ globalUsers: !globalUsers, data: [] }), () => this.search());
	}

	toggleDropdown = () => {
		this.setState(({ showOptionsDropdown }) => ({ showOptionsDropdown: !showOptionsDropdown }));
	}

	goRoom = (item) => {
		const { navigation, isMasterDetail } = this.props;
		if (isMasterDetail) {
			navigation.navigate('DrawerNavigator');
		} else {
			navigation.navigate('RoomsListView');
		}
		goRoom({ item, isMasterDetail });
	}

	onPressItem = (item) => {
		const { type } = this.state;
		const { navigation } = this.props;
		if (type === 'users') {
			const postUser = {
				_id: item._id,
				username: item.username,
				name: item.name
			};
			navigation.navigate('ConnectView', { user: postUser, fromRid: item._id });
		} else {
			this.goRoom({
				rid: item._id, name: item.name, t: 'c', search: true
			});
		}
	}

	renderHeader = () => (
		<SearchBox
			onChangeText={this.onSearchChangeText}
			onSubmitEditing={this.search}
			clearText={this.search}
			testID='federation-view-search'
		/>
	)

	renderItem = ({ item, index }) => {
		const { data, type } = this.state;
		const { baseUrl, user, theme } = this.props;


		let style;
		if (index === data.length - 1) {
			style = {
				...sharedStyles.separatorBottom,
				borderColor: themes[theme].separatorColor
			};
		}
		const commonProps = {
			title: item?.name,
			onPress: () => this.onPressItem(item),
			baseUrl,
			testID: `federation-view-item-${ item?.name }`,
			style,
			user,
			theme
		};

		if (type === 'users') {
			return (
				<DirectoryItem
					avatar={item?.username}
					description={item?.customFields?.Location ?? ''}
					rightLabel={item?.federation && item?.federation.peer}
					type='d'
					icon={<CustomIcon name='pin-map' size={15} color='#161a1d' />}
					age={`${ item?.customFields?.Age ?? '?' } years old`}
					{...commonProps}
				/>
			);
		}

		return (
			<DirectoryItem
				avatar={item.name}
				description={item.topic}
				typeIcon={<RoomTypeIcon type={type} theme={theme} />}
				rightLabel={I18n.t('N_users', { n: item.usersCount })}
				type='c'
				{...commonProps}
			/>
		);
	}

	render = () => {
		const {
			data, loading, refreshing, showOptionsDropdown, type, globalUsers
		} = this.state;
		const { isFederationEnabled, theme } = this.props;
		return (
			<SafeAreaView
				style={{ backgroundColor: themes[theme].backgroundColor }}
				testID='directory-view'
				theme={theme}
			>
				<StatusBar theme={theme} />
				<FlatList
					data={data}
					style={styles.list}
					contentContainerStyle={styles.listContainer}
					extraData={this.state}
					keyExtractor={item => (item && item._id ? item._id : String(Math.random()))}
					ListHeaderComponent={this.renderHeader}
					renderItem={this.renderItem}
					keyboardShouldPersistTaps='always'
					showsVerticalScrollIndicator={false}
					ListFooterComponent={loading ? <ActivityIndicator theme={theme} /> : null}
					onEndReached={this.onEndReached}
					refreshControl={(
						<RefreshControl
							refreshing={refreshing}
							onRefresh={() => {
								this.setState({
									refreshing: true
								});
								this.load({ newSearch: true });
							}}
							tintColor={themes[theme].auxiliaryText}
						/>
					)}
				/>
				{showOptionsDropdown
					? (
						<Options
							theme={theme}
							type={type}
							globalUsers={globalUsers}
							close={this.toggleDropdown}
							changeType={this.changeType}
							toggleWorkspace={this.toggleWorkspace}
							isFederationEnabled={isFederationEnabled}
						/>
					)
					: null}
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.server.server,
	user: getUserSelector(state),
	isFederationEnabled: state.settings.FEDERATION_Enabled,
	directoryDefaultView: 'users',
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps)(withTheme(ProfileLibraryView));
