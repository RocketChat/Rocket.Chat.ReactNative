import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, LayoutAnimation, FlatList, ActivityIndicator, Keyboard, BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-navigation';
import ShareExtension from 'rn-extensions-share';
import { connect } from 'react-redux';
import RNFetchBlob from 'rn-fetch-blob';
import * as mime from 'react-native-mime-types';
import { isEqual } from 'lodash';

import Navigation from '../../lib/ShareNavigation';
import database from '../../lib/realm';
import { isIOS, isAndroid } from '../../utils/deviceInfo';
import I18n from '../../i18n';
import { CustomIcon } from '../../lib/Icons';
import log from '../../utils/log';
import { canUploadFile } from '../../utils/media';
import DirectoryItem, { ROW_HEIGHT } from '../../presentation/DirectoryItem';
import ServerItem from '../../presentation/ServerItem';
import { CloseShareExtensionButton, CustomHeaderButtons, Item } from '../../containers/HeaderButton';
import ShareListHeader from './Header';

import styles from './styles';
import StatusBar from '../../containers/StatusBar';

const LIMIT = 50;
const getItemLayout = (data, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });
const keyExtractor = item => item.rid;

class ShareListView extends React.Component {
	static navigationOptions = ({ navigation }) => {
		const searching = navigation.getParam('searching');
		const initSearch = navigation.getParam('initSearch', () => {});
		const cancelSearch = navigation.getParam('cancelSearch', () => {});
		const search = navigation.getParam('search', () => {});

		if (isIOS) {
			return {
				headerTitle: (
					<ShareListHeader
						searching={searching}
						initSearch={initSearch}
						cancelSearch={cancelSearch}
						search={search}
					/>
				)
			};
		}

		return {
			headerBackTitle: null,
			headerLeft: searching
				? (
					<CustomHeaderButtons left>
						<Item title='cancel' iconName='cross' onPress={cancelSearch} />
					</CustomHeaderButtons>
				)
				: (
					<CloseShareExtensionButton
						onPress={ShareExtension.close}
						testID='share-extension-close'
					/>
				),
			headerTitle: <ShareListHeader searching={searching} search={search} />,
			headerRight: (
				searching
					? null
					: (
						<CustomHeaderButtons>
							{isAndroid ? <Item title='search' iconName='magnifier' onPress={initSearch} /> : null}
						</CustomHeaderButtons>
					)
			)
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		server: PropTypes.string,
		baseUrl: PropTypes.string,
		token: PropTypes.string,
		userId: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.data = [];
		this.state = {
			showError: false,
			searching: false,
			searchText: '',
			value: '',
			isMedia: false,
			mediaLoading: false,
			fileInfo: null,
			searchResults: [],
			chats: [],
			servers: [],
			loading: true,
			serverInfo: null
		};
		this.didFocusListener = props.navigation.addListener('didFocus', () => BackHandler.addEventListener('hardwareBackPress', this.handleBackPress));
		this.willBlurListener = props.navigation.addListener('willBlur', () => BackHandler.addEventListener('hardwareBackPress', this.handleBackPress));
	}

	async componentDidMount() {
		const { navigation, server } = this.props;
		navigation.setParams({
			initSearch: this.initSearch,
			cancelSearch: this.cancelSearch,
			search: this.search
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
					mime: mime.lookup(data.path),
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

		this.getSubscriptions(server);
	}

	componentWillReceiveProps(nextProps) {
		const { server } = this.props;
		if (nextProps.server !== server) {
			this.getSubscriptions(nextProps.server);
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { searching } = this.state;
		if (nextState.searching !== searching) {
			return true;
		}

		const { isMedia } = this.state;
		if (nextState.isMedia !== isMedia) {
			this.getSubscriptions(nextProps.server, nextState.fileInfo);
			return true;
		}

		const { server } = this.props;
		if (server !== nextProps.server) {
			return true;
		}

		const { searchResults } = this.state;
		if (!isEqual(nextState.searchResults, searchResults)) {
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

	getSubscriptions = (server, fileInfo) => {
		const { fileInfo: fileData } = this.state;
		const { serversDB } = database.databases;

		if (server) {
			this.data = database.objects('subscriptions').filtered('archived != true && open == true').sorted('roomUpdatedAt', true);
			this.servers = serversDB.objects('servers');
			this.chats = this.data.slice(0, LIMIT);
			const serverInfo = serversDB.objectForPrimaryKey('servers', server);

			this.internalSetState({
				chats: this.chats ? this.chats.slice() : [],
				servers: this.servers ? this.servers.slice() : [],
				loading: false,
				showError: !canUploadFile(fileInfo || fileData, serverInfo),
				serverInfo
			});
			this.forceUpdate();
		}
	};

	uriToPath = uri => decodeURIComponent(isIOS ? uri.replace(/^file:\/\//, '') : uri);

	getRoomTitle = (item) => {
		const { serverInfo } = this.state;
		const { useRealName } = serverInfo;
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

	search = (text) => {
		const result = database.objects('subscriptions').filtered('name CONTAINS[c] $0', text);
		this.internalSetState({
			searchResults: result.slice(0, LIMIT),
			searchText: text
		});
	}

	initSearch = () => {
		const { chats } = this.state;
		const { navigation } = this.props;
		this.setState({ searching: true, searchResults: chats });
		navigation.setParams({ searching: true });
	}

	cancelSearch = () => {
		const { navigation } = this.props;
		this.internalSetState({ searching: false, searchResults: [], searchText: '' });
		navigation.setParams({ searching: false });
		Keyboard.dismiss();
	}

	handleBackPress = () => {
		const { searching } = this.state;
		if (searching) {
			this.cancelSearch();
			return true;
		}
		return false;
	}

	renderSectionHeader = (header) => {
		const { searching } = this.state;
		if (searching) {
			return null;
		}

		return (
			<View style={styles.headerContainer}>
				<Text style={styles.headerText}>
					{I18n.t(header)}
				</Text>
			</View>
		);
	}

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

	renderBorderBottom = () => <View style={styles.borderBottom} />;

	renderSelectServer = () => {
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

	renderEmptyComponent = () => (
		<View style={[styles.container, styles.emptyContainer]}>
			<Text style={styles.title}>{I18n.t('No_results_found')}</Text>
		</View>
	);

	renderHeader = () => {
		const { searching } = this.state;
		return (
			<React.Fragment>
				{ !searching
					? (
						<React.Fragment>
							{this.renderSelectServer()}
							{this.renderSectionHeader('Chats')}
						</React.Fragment>
					)
					: null
				}
			</React.Fragment>
		);
	}

	renderContent = () => {
		const {
			chats, mediaLoading, loading, searchResults, searching, searchText
		} = this.state;

		if (mediaLoading || loading) {
			return <ActivityIndicator style={styles.loading} />;
		}

		return (
			<FlatList
				data={searching ? searchResults : chats}
				keyExtractor={keyExtractor}
				style={styles.flatlist}
				renderItem={this.renderItem}
				getItemLayout={getItemLayout}
				ItemSeparatorComponent={this.renderSeparator}
				ListHeaderComponent={this.renderHeader}
				ListFooterComponent={!searching && this.renderBorderBottom}
				ListHeaderComponentStyle={!searching ? styles.borderBottom : {}}
				ListEmptyComponent={searching && searchText ? this.renderEmptyComponent : null}
				enableEmptySections
				removeClippedSubviews
				keyboardShouldPersistTaps='always'
				initialNumToRender={12}
				windowSize={20}
			/>
		);
	}

	renderError = () => {
		const {
			fileInfo: file, loading, searching, serverInfo
		} = this.state;
		const { FileUpload_MaxFileSize } = serverInfo;
		const errorMessage = (FileUpload_MaxFileSize < file.size)
			? 'error-file-too-large'
			: 'error-invalid-file-type';

		if (loading) {
			return <ActivityIndicator style={styles.loading} />;
		}

		return (
			<View style={styles.container}>
				{ !searching
					? (
						<React.Fragment>
							{this.renderSelectServer()}
						</React.Fragment>
					)
					: null
				}
				<View style={[styles.container, styles.centered]}>
					<Text style={styles.title}>{I18n.t(errorMessage)}</Text>
					<CustomIcon name='circle-cross' size={120} style={styles.errorIcon} />
					<Text style={styles.fileMime}>{ file.mime }</Text>
				</View>
			</View>
		);
	}

	render() {
		const { showError } = this.state;
		return (
			<SafeAreaView style={styles.container} forceInset={{ vertical: 'never' }}>
				<StatusBar />
				{ showError ? this.renderError() : this.renderContent() }
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (({ share }) => ({
	userId: share.user && share.user.id,
	token: share.user && share.user.token,
	server: share.server,
	baseUrl: share ? share.server : ''
}));

export default connect(mapStateToProps)(ShareListView);
