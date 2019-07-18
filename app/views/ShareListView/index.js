import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, LayoutAnimation, InteractionManager, FlatList, ScrollView, ActivityIndicator, Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-navigation';
import ShareExtension from 'rn-extensions-share';
import { connect } from 'react-redux';
import RNFetchBlob from 'rn-fetch-blob';
import * as mime from 'react-native-mime-types';
import { isEqual } from 'lodash';

import Navigation from '../../lib/Navigation';
import database, { safeAddListener } from '../../lib/realm';
import debounce from '../../utils/debounce';
import { isIOS, isAndroid } from '../../utils/deviceInfo';
import I18n from '../../i18n';
import { CustomIcon } from '../../lib/Icons';
import log from '../../utils/log';
import {
	openSearchHeader as openSearchHeaderAction,
	closeSearchHeader as closeSearchHeaderAction
} from '../../actions/rooms';
import DirectoryItem, { ROW_HEIGHT } from '../../presentation/DirectoryItem';
import ServerItem, { ROW_HEIGHT as ROW_HEIGHT_SERVER } from '../../presentation/ServerItem';
import { CloseShareExtensionButton, CustomHeaderButtons, Item } from '../../containers/HeaderButton';
import SearchBar from '../RoomsListView/ListHeader/SearchBar';
import ShareListHeader from './Header';

import styles from './styles';

const SCROLL_OFFSET = 56;
const getItemLayoutChannel = (data, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });
const getItemLayoutServer = (data, index) => ({ length: ROW_HEIGHT_SERVER, offset: ROW_HEIGHT_SERVER * index, index });
const keyExtractor = item => item.rid;

@connect(state => ({
	userId: state.login.user && state.login.user.id,
	token: state.login.user && state.login.user.token,
	useRealName: state.settings.UI_Use_Real_Name,
	searchText: state.rooms.searchText,
	server: state.server.server,
	loading: state.server.loading,
	FileUpload_MediaTypeWhiteList: state.settings.FileUpload_MediaTypeWhiteList,
	FileUpload_MaxFileSize: state.settings.FileUpload_MaxFileSize,
	baseUrl: state.settings.baseUrl || state.server ? state.server.server : '',
	sortBy: state.sortPreferences.sortBy,
	groupByType: state.sortPreferences.groupByType,
	showFavorites: state.sortPreferences.showFavorites
}), dispatch => ({
	openSearchHeader: () => dispatch(openSearchHeaderAction()),
	closeSearchHeader: () => dispatch(closeSearchHeaderAction())
}))
/** @extends React.Component */
export default class ShareListView extends React.Component {
	static navigationOptions = ({ navigation }) => {
		const searching = navigation.getParam('searching');
		const cancelSearchingAndroid = navigation.getParam('cancelSearchingAndroid');
		const initSearchingAndroid = navigation.getParam('initSearchingAndroid', () => {});

		return {
			headerBackTitle: isIOS ? I18n.t('Back') : null,
			headerLeft: searching
				? (
					<CustomHeaderButtons left>
						<Item title='cancel' iconName='cross' onPress={cancelSearchingAndroid} />
					</CustomHeaderButtons>
				)
				: (
					<CloseShareExtensionButton
						onPress={ShareExtension.close}
						testID='share-extension-close'
					/>
				),
			headerTitle: <ShareListHeader />,
			headerRight: (
				searching
					? null
					: (
						<CustomHeaderButtons>
							{isAndroid ? <Item title='search' iconName='magnifier' onPress={initSearchingAndroid} /> : null}
						</CustomHeaderButtons>
					)
			)
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		server: PropTypes.string,
		useRealName: PropTypes.bool,
		searchText: PropTypes.string,
		FileUpload_MediaTypeWhiteList: PropTypes.string,
		FileUpload_MaxFileSize: PropTypes.number,
		openSearchHeader: PropTypes.func,
		closeSearchHeader: PropTypes.func,
		baseUrl: PropTypes.string,
		token: PropTypes.string,
		userId: PropTypes.string,
		sortBy: PropTypes.string,
		groupByType: PropTypes.bool,
		showFavorites: PropTypes.bool,
		loading: PropTypes.bool
	}

	constructor(props) {
		super(props);
		this.data = [];
		this.state = {
			searching: false,
			value: '',
			isMedia: false,
			mediaLoading: false,
			loading: true,
			fileInfo: null,
			search: [],
			discussions: [],
			channels: [],
			favorites: [],
			chats: [],
			privateGroup: [],
			direct: [],
			livechat: [],
			servers: []
		};
	}

	async componentDidMount() {
		this.getSubscriptions();

		const { navigation } = this.props;
		navigation.setParams({
			initSearchingAndroid: this.initSearchingAndroid,
			cancelSearchingAndroid: this.cancelSearchingAndroid
		});

		try {
			const { value, type } = await ShareExtension.data();
			let fileInfo = null;
			const isMedia = (type === 'media');
			if (isMedia) {
				this.setState({ mediaLoading: true });
				const data = await RNFetchBlob.fs.stat(this.uriToPath(value));
				fileInfo = {
					name: data.filename,
					description: '',
					size: data.size,
					type: mime.lookup(data.path),
					store: 'Uploads',
					path: isIOS ? data.path : `file://${ data.path }`
				};
			}
			this.setState({
				value, fileInfo, isMedia, mediaLoading: false
			});
		} catch (e) {
			log('err_process_media_share_extension', e);
			this.setState({ mediaLoading: false });
		}
	}

	componentWillReceiveProps(nextProps) {
		const { searchText, loading } = this.props;

		if (nextProps.server && loading !== nextProps.loading) {
			if (nextProps.loading) {
				this.internalSetState({ loading: true });
			} else {
				this.getSubscriptions();
			}
		} else if (searchText !== nextProps.searchText) {
			this.search(nextProps.searchText);
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { loading, searching } = this.state;
		if (nextState.loading !== loading) {
			return true;
		}
		if (nextState.searching !== searching) {
			return true;
		}

		const { search } = this.state;
		if (!isEqual(nextState.search, search)) {
			return true;
		}
		return false;
	}

	// eslint-disable-next-line react/sort-comp
	internalSetState = (...args) => {
		const { navigation } = this.props;
		if (isIOS && navigation.isFocused()) {
			LayoutAnimation.easeInEaseOut();
		}
		this.setState(...args);
	}

	getSubscriptions = debounce(() => {
		if (this.data && this.data.removeAllListeners) {
			this.data.removeAllListeners();
		}

		const {
			server, sortBy, showFavorites, groupByType
		} = this.props;
		const { serversDB } = database.databases;

		if (server) {
			this.data = database.objects('subscriptions').filtered('archived != true && open == true');
			if (sortBy === 'alphabetical') {
				this.data = this.data.sorted('name', false);
			} else {
				this.data = this.data.sorted('roomUpdatedAt', true);
			}
			// servers
			this.servers = serversDB.objects('servers');

			// favorites
			if (showFavorites) {
				this.favorites = this.data.filtered('f == true');
			} else {
				this.favorites = [];
			}

			// type
			if (groupByType) {
				this.discussions = this.data.filtered('prid != null');
				this.channels = this.data.filtered('t == $0 AND prid == null', 'c');
				this.privateGroup = this.data.filtered('t == $0 AND prid == null', 'p');
				this.direct = this.data.filtered('t == $0 AND prid == null', 'd');
				this.livechat = this.data.filtered('t == $0 AND prid == null', 'l');
			} else {
				this.chats = this.data;
			}
			safeAddListener(this.data, this.updateState);
		}
	}, 300);

	uriToPath = uri => decodeURIComponent(isIOS ? uri.replace(/^file:\/\//, '') : uri);

	// eslint-disable-next-line react/sort-comp
	updateState = debounce(() => {
		this.updateStateInteraction = InteractionManager.runAfterInteractions(() => {
			this.internalSetState({
				chats: this.chats ? this.chats.slice() : [],
				favorites: this.favorites ? this.favorites.slice() : [],
				discussions: this.discussions ? this.discussions.slice() : [],
				channels: this.channels ? this.channels.slice() : [],
				privateGroup: this.privateGroup ? this.privateGroup.slice() : [],
				direct: this.direct ? this.direct.slice() : [],
				livechat: this.livechat ? this.livechat.slice() : [],
				servers: this.servers ? this.servers.slice() : [],
				loading: false
			});
			this.forceUpdate();
		});
	}, 300);

	getRoomTitle = (item) => {
		const { useRealName } = this.props;
		return ((item.prid || useRealName) && item.fname) || item.name;
	}

	shareMessage = (item) => {
		const { value, isMedia, fileInfo } = this.state;
		const { navigation } = this.props;

		navigation.navigate('ShareView', {
			rid: item.rid,
			value,
			isMedia,
			fileInfo,
			name: this.getRoomTitle(item)
		});
	}

	canUploadFile = () => {
		const { FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize } = this.props;
		const { fileInfo: file, mediaLoading, loading } = this.state;

		if (loading || mediaLoading) {
			return true;
		}
		if (!(file && file.path)) {
			return true;
		}
		if (file.size > FileUpload_MaxFileSize) {
			return false;
		}
		if (!FileUpload_MediaTypeWhiteList) {
			return false;
		}
		const allowedMime = FileUpload_MediaTypeWhiteList.split(',');
		if (allowedMime.includes(file.type)) {
			return true;
		}
		const wildCardGlob = '/*';
		const wildCards = allowedMime.filter(item => item.indexOf(wildCardGlob) > 0);
		if (wildCards.includes(file.type.replace(/(\/.*)$/, wildCardGlob))) {
			return true;
		}
		return false;
	}

	search = (text) => {
		const result = database.objects('subscriptions').filtered('name CONTAINS[c] $0', text);
		const subscriptions = database.objects('subscriptions');
		const data = result.length !== subscriptions.length ? result : [];
		this.internalSetState({
			search: data
		});
	}

	initSearchingAndroid = () => {
		const { openSearchHeader, navigation } = this.props;
		this.setState({ searching: true });
		navigation.setParams({ searching: true });
		openSearchHeader();
	}

	cancelSearchingAndroid = () => {
		if (isAndroid) {
			const { closeSearchHeader, navigation } = this.props;
			this.setState({ searching: false });
			navigation.setParams({ searching: false });
			closeSearchHeader();
			this.internalSetState({ search: [] });
			Keyboard.dismiss();
		}
	}

	renderListHeader = () => <SearchBar onChangeSearchText={this.search} />;

	renderSectionHeader = header => (
		<View style={styles.headerContainer}>
			<Text style={styles.headerText}>
				{I18n.t(header)}
			</Text>
		</View>
	)

	renderItem = ({ item }) => {
		const { userId, token, baseUrl } = this.props;
		return (
			<DirectoryItem
				user={{
					userId,
					token
				}}
				title={this.getRoomTitle(item)}
				baseUrl={baseUrl}
				avatar={this.getRoomTitle(item)}
				description={
					item.t === 'c'
						? (item.topic || item.description)
						: item.fname
				}
				type={item.t}
				onPress={() => this.shareMessage(item)}
				testID={`share-extension-item-${ item.name }`}
			/>
		);
	}

	renderSeparator = () => <View style={styles.separator} />;

	renderSection = (data, header) => {
		if (data && data.length > 0) {
			return (
				<React.Fragment>
					{this.renderSectionHeader(header)}
					<View style={styles.bordered}>
						<FlatList
							data={data}
							keyExtractor={keyExtractor}
							style={styles.flatlist}
							renderItem={this.renderItem}
							ItemSeparatorComponent={this.renderSeparator}
							getItemLayout={getItemLayoutServer}
							enableEmptySections
							removeClippedSubviews
							keyboardShouldPersistTaps='always'
							initialNumToRender={12}
							windowSize={20}
						/>
					</View>
				</React.Fragment>
			);
		}
		return null;
	}

	renderServerSelector = () => {
		const { servers } = this.state;
		const { server } = this.props;
		const currentServer = servers.find(serverFiltered => serverFiltered.id === server);
		return currentServer ? (
			<React.Fragment>
				{this.renderSectionHeader('Select_Server')}
				<View style={styles.bordered}>
					<ServerItem
						server={server}
						onPress={() => Navigation.navigate('SelectServerView')}
						item={currentServer}
					/>
				</View>
			</React.Fragment>
		) : null;
	}

	renderContent = () => {
		const {
			discussions, channels, privateGroup, direct, livechat, search, chats, favorites
		} = this.state;

		if (search.length > 0) {
			return (
				<FlatList
					data={search}
					extraData={search}
					keyExtractor={keyExtractor}
					style={styles.flatlist}
					renderItem={this.renderItem}
					getItemLayout={getItemLayoutChannel}
					ItemSeparatorComponent={this.renderSeparator}
					enableEmptySections
					removeClippedSubviews
					keyboardShouldPersistTaps='always'
					initialNumToRender={12}
					windowSize={20}
				/>
			);
		}

		return (
			<View style={styles.content}>
				{this.renderServerSelector()}
				{this.renderSection(favorites, 'Favorites')}
				{this.renderSection(discussions, 'Discussions')}
				{this.renderSection(channels, 'Channels')}
				{this.renderSection(direct, 'Direct_Messages')}
				{this.renderSection(privateGroup, 'Private_Groups')}
				{this.renderSection(livechat, 'Livechat')}
				{this.renderSection(chats, 'Chats')}
			</View>
		);
	}


	renderScrollView = () => {
		const { mediaLoading, loading } = this.state;
		if (mediaLoading || loading) {
			return <ActivityIndicator style={styles.loading} />;
		}

		return (
			<ScrollView
				style={styles.scroll}
				contentOffset={isIOS ? { x: 0, y: SCROLL_OFFSET } : {}}
				keyboardShouldPersistTaps='always'
			>
				{this.renderListHeader()}
				{this.renderContent()}
			</ScrollView>
		);
	}

	renderError = () => {
		const { fileInfo: file } = this.state;
		const { FileUpload_MaxFileSize } = this.props;
		const errorMessage = (FileUpload_MaxFileSize < file.size)
			? 'error-file-too-large'
			: 'error-invalid-file-type';
		return (
			<View style={styles.container}>
				<Text style={styles.title}>{I18n.t(errorMessage)}</Text>
				<CustomIcon name='circle-cross' size={120} style={styles.errorIcon} />
				<Text style={styles.fileMime}>{ file.type }</Text>
			</View>
		);
	}

	render() {
		const showError = !this.canUploadFile();
		return (
			<SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
				{ showError ? this.renderError() : this.renderScrollView() }
			</SafeAreaView>
		);
	}
}
