import React from 'react';
import PropTypes from 'prop-types';
import {
	View, FlatList
} from 'react-native';
import { connect } from 'react-redux';
import RocketChat from '../../lib/rocketchat';
import DirectoryItem from '../../presentation/DirectoryItem';
import sharedStyles from '../Styles';
import I18n from '../../i18n';
import SearchBox from '../../containers/SearchBox';
import StatusBar from '../../containers/StatusBar';
import ActivityIndicator from '../../containers/ActivityIndicator';
import * as HeaderButton from '../../containers/HeaderButton';
import debounce from '../../utils/debounce';
import log, { logEvent, events } from '../../utils/log';
import Options from './Options';
import { CustomIcon } from '../../lib/Icons';
import { withTheme } from '../../theme';
import { themes } from '../../constants/colors';
import styles from './styles';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import { goRoom } from '../../utils/goRoom';
import RoomTypeIcon from '../../containers/RoomTypeIcon';

class ProfileLibraryView extends React.Component {
	
	static navigationOptions = ({ navigation, isMasterDetail }) => {
		const options = {
			title: I18n.t('Profile_library')
		};
		if (!isMasterDetail) {
			options.headerLeft = () => <HeaderButton.Drawer navigation={navigation} />;
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
			text: '',
			total: -1,
			showOptionsDropdown: false,
			globalUsers: true,
			type: props.directoryDefaultView,
		};
	}
	 userInfoObject = {};

	componentDidMount() {
		this.load({});
		logEvent(events.DIRECTORY_SEARCH_USERS);
	}

	onSearchChangeText = (text) => {
		this.setState({ text });
	}

	// eslint-disable-next-line react/sort-comp
	load = debounce(async({ newSearch = false }) => {
	
		if (newSearch) {
			this.setState({ data: [], total: -1, loading: false });
		}
		const {
			loading, text, total, data: { length }
		} = this.state;
		if (loading || length === total) {
			return;
		}

		this.setState({ loading: true });

		try {
			const { data, type, globalUsers } = this.state;
			const query = { text, type, workspace: globalUsers ? 'all' : 'local' };

			const directories = await RocketChat.getProfileLibrary({
				query,
				offset: data.length,
				count: 50,
				sort: (type === 'users') ? { username: 1 } : { usersCount: -1 }
			});

			if (directories.success) {
				const results = directories.result;

				const userInfo = await Promise.all(results.map(async(item) => {
					const user = await RocketChat.getUserInfo(item._id);
					return {id: user.user.customFields};
				}));
			userInfo.forEach(data => userInfoObject = {...data, ...userInfo})
			
				
				this.setState({
					data: [...data, ...results],
					loading: false,
					total: results.length
				});
			} else {
				this.setState({ loading: false });
			}
		} catch (e) {
			log(e);
			this.setState({ loading: false });
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
			const navParam = {
				rid: item._id,
				t: 'd',
				isPeerSupporter: true
			};
			// alert(JSON.stringify(item));
			navigation.navigate('RoomInfoView', navParam);
		} else {
			this.goRoom({
				rid: item._id, name: item.name, t: 'c', search: true
			});
		}
	}

	renderHeader = () => {
		return (
			<>
				<SearchBox
					onChangeText={this.onSearchChangeText}
					onSubmitEditing={this.search}
					testID='federation-view-search'
				/>

			</>
		);
	}


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
		const PinIcon = () => <CustomIcon name='pin-map' size={15} color='#161a1d' />;
		const TypeIcon = <RoomTypeIcon type={type} theme={theme} />;
		const commonProps = {
			title: item.name,
			onPress: () => this.onPressItem(item),
			baseUrl,
			testID: `federation-view-item-${ item.name }`,
			style,
			user,
			theme
		};

		if (type === 'users') {
			return (
				<DirectoryItem
					avatar={item.username}
					description={userInfoObject[`${index}`].id.Location}
					rightLabel={item.federation && item.federation.peer}
					type='d'
					icon={PinIcon()}
					age={`${userInfoObject[`${index}`].id.Age} years old`}
					{...commonProps}
				/>
			);
		}
		return (
			<DirectoryItem
				avatar={item.name}
				description={item.topic}
				typeIcon={TypeIcon()}
				rightLabel={I18n.t('N_users', { n: item.usersCount })}
				type='c'
				{...commonProps}
			/>
		);
	}

	render = () => {
		const {
			data, loading, showOptionsDropdown, type, globalUsers
		} = this.state;
		console.log('00000000000',data)
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
					keyExtractor={item => item._id}
					ListHeaderComponent={this.renderHeader}
					renderItem={this.renderItem}
					// ItemSeparatorComponent={this.renderSeparator}
					keyboardShouldPersistTaps='always'
					ListFooterComponent={loading ? <ActivityIndicator theme={theme} /> : null}
					onEndReached={() => this.load({})}
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
