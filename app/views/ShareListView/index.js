import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, FlatList, Keyboard, BackHandler
} from 'react-native';
import ShareExtension from 'rn-extensions-share';
import { connect } from 'react-redux';
import RNFetchBlob from 'rn-fetch-blob';
import * as mime from 'react-native-mime-types';
import { isEqual, orderBy } from 'lodash';
import { Q } from '@nozbe/watermelondb';

import database from '../../lib/database';
import { isIOS } from '../../utils/deviceInfo';
import I18n from '../../i18n';
import { CustomIcon } from '../../lib/Icons';
import log from '../../utils/log';
import { canUploadFile } from '../../utils/media';
import DirectoryItem, { ROW_HEIGHT } from '../../presentation/DirectoryItem';
import ServerItem from '../../presentation/ServerItem';
import { CancelModalButton, CustomHeaderButtons, Item } from '../../containers/HeaderButton';
import ShareListHeader from './Header';
import ActivityIndicator from '../../containers/ActivityIndicator';

import styles from './styles';
import StatusBar from '../../containers/StatusBar';
import { themes } from '../../constants/colors';
import { animateNextTransition } from '../../utils/layoutAnimation';
import { withTheme } from '../../theme';
import SafeAreaView from '../../containers/SafeAreaView';

const LIMIT = 50;
const getItemLayout = (data, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });
const keyExtractor = item => item.rid;

class ShareListView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		server: PropTypes.string,
		token: PropTypes.string,
		userId: PropTypes.string,
		theme: PropTypes.string
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
		this.setHeader();
		this.unsubscribeFocus = props.navigation.addListener('focus', () => BackHandler.addEventListener('hardwareBackPress', this.handleBackPress));
		this.unsubscribeBlur = props.navigation.addListener('blur', () => BackHandler.addEventListener('hardwareBackPress', this.handleBackPress));
	}

	componentDidMount() {
		const { server } = this.props;
		setTimeout(async() => {
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
				log(e);
				this.setState({ mediaLoading: false });
			}

			this.getSubscriptions(server);
		}, 500);
	}

	UNSAFE_componentWillReceiveProps(nextProps) {
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

		const { server, theme } = this.props;
		if (server !== nextProps.server) {
			return true;
		}
		if (theme !== nextProps.theme) {
			return true;
		}

		const { searchResults } = this.state;
		if (!isEqual(nextState.searchResults, searchResults)) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		if (this.unsubscribeFocus) {
			this.unsubscribeFocus();
		}
		if (this.unsubscribeBlur) {
			this.unsubscribeBlur();
		}
	}

	setHeader = () => {
		const { searching } = this.state;
		const { navigation, theme } = this.props;

		if (isIOS) {
			navigation.setOptions({
				header: () => (
					<ShareListHeader
						searching={searching}
						initSearch={this.initSearch}
						cancelSearch={this.cancelSearch}
						search={this.search}
						theme={theme}
					/>
				)
			});
			return;
		}

		navigation.setOptions({
			headerLeft: () => (searching
				? (
					<CustomHeaderButtons left>
						<Item title='cancel' iconName='Cross' onPress={this.cancelSearch} />
					</CustomHeaderButtons>
				)
				: (
					<CancelModalButton
						onPress={ShareExtension.close}
						testID='share-extension-close'
					/>
				)),
			headerTitle: () => <ShareListHeader searching={searching} search={this.search} theme={theme} />,
			headerRight: () => (
				searching
					? null
					: (
						<CustomHeaderButtons>
							<Item title='search' iconName='magnifier' onPress={this.initSearch} />
						</CustomHeaderButtons>
					)
			)
		});
	}

	// eslint-disable-next-line react/sort-comp
	internalSetState = (...args) => {
		const { navigation } = this.props;
		if (navigation.isFocused()) {
			animateNextTransition();
		}
		this.setState(...args);
	}

	getSubscriptions = async(server, fileInfo) => {
		const { fileInfo: fileData } = this.state;
		const db = database.active;
		const serversDB = database.servers;

		if (server) {
			this.data = await db.collections
				.get('subscriptions')
				.query(
					Q.where('archived', false),
					Q.where('open', true)
				).fetch();
			this.data = orderBy(this.data, ['roomUpdatedAt'], ['desc']);

			const serversCollection = serversDB.collections.get('servers');
			this.servers = await serversCollection.query().fetch();
			this.chats = this.data.slice(0, LIMIT);
			let serverInfo = {};
			try {
				serverInfo = await serversCollection.find(server);
			} catch (error) {
				// Do nothing
			}

			const canUploadFileResult = canUploadFile(fileInfo || fileData, serverInfo);

			this.internalSetState({
				chats: this.chats ? this.chats.slice() : [],
				servers: this.servers ? this.servers.slice() : [],
				loading: false,
				showError: !canUploadFileResult.success,
				error: canUploadFileResult.error,
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
		const result = this.data.filter(item => item.name.includes(text)) || [];
		this.internalSetState({
			searchResults: result.slice(0, LIMIT),
			searchText: text
		});
	}

	initSearch = () => {
		const { chats } = this.state;
		this.setState({ searching: true, searchResults: chats }, () => this.setHeader());
	}

	cancelSearch = () => {
		this.internalSetState({ searching: false, searchResults: [], searchText: '' }, () => this.setHeader());
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
		const { theme } = this.props;
		if (searching) {
			return null;
		}

		return (
			<View style={[styles.headerContainer, { backgroundColor: themes[theme].auxiliaryBackground }]}>
				<Text style={[styles.headerText, { color: themes[theme].titleText }]}>
					{I18n.t(header)}
				</Text>
			</View>
		);
	}

	renderItem = ({ item }) => {
		const {
			userId, token, server, theme
		} = this.props;
		return (
			<DirectoryItem
				user={{
					id: userId,
					token
				}}
				title={this.getRoomTitle(item)}
				baseUrl={server}
				avatar={this.getRoomTitle(item)}
				description={
					item.t === 'c'
						? (item.topic || item.description)
						: item.fname
				}
				type={item.t}
				onPress={() => this.shareMessage(item)}
				testID={`share-extension-item-${ item.name }`}
				theme={theme}
			/>
		);
	}

	renderSeparator = () => {
		const { theme } = this.props;
		return <View style={[styles.separator, { borderColor: themes[theme].separatorColor }]} />;
	}

	renderBorderBottom = () => {
		const { theme } = this.props;
		return <View style={[styles.borderBottom, { borderColor: themes[theme].separatorColor }]} />;
	}

	renderSelectServer = () => {
		const { servers } = this.state;
		const { server, theme, navigation } = this.props;
		const currentServer = servers.find(serverFiltered => serverFiltered.id === server);
		return currentServer ? (
			<>
				{this.renderSectionHeader('Select_Server')}
				<View
					style={[
						styles.bordered,
						{
							borderColor: themes[theme].separatorColor,
							backgroundColor: themes[theme].auxiliaryBackground
						}
					]}
				>
					<ServerItem
						server={server}
						onPress={() => navigation.navigate('SelectServerView', { servers: this.servers })}
						item={currentServer}
						theme={theme}
					/>
				</View>
			</>
		) : null;
	}

	renderEmptyComponent = () => {
		const { theme } = this.props;
		return (
			<View style={[styles.container, styles.emptyContainer, { backgroundColor: themes[theme].auxiliaryBackground }]}>
				<Text style={[styles.title, { color: themes[theme].titleText }]}>{I18n.t('No_results_found')}</Text>
			</View>
		);
	}

	renderHeader = () => {
		const { searching } = this.state;
		return (
			<>
				{ !searching
					? (
						<>
							{this.renderSelectServer()}
							{this.renderSectionHeader('Chats')}
						</>
					)
					: null
				}
			</>
		);
	}

	renderContent = () => {
		const {
			chats, mediaLoading, loading, searchResults, searching, searchText
		} = this.state;
		const { theme } = this.props;

		if (mediaLoading || loading) {
			return <ActivityIndicator theme={theme} />;
		}

		return (
			<FlatList
				data={searching ? searchResults : chats}
				keyExtractor={keyExtractor}
				style={[styles.flatlist, { backgroundColor: themes[theme].auxiliaryBackground }]}
				contentContainerStyle={{ backgroundColor: themes[theme].backgroundColor }}
				renderItem={this.renderItem}
				getItemLayout={getItemLayout}
				ItemSeparatorComponent={this.renderSeparator}
				ListHeaderComponent={this.renderHeader}
				ListFooterComponent={!searching && this.renderBorderBottom}
				ListHeaderComponentStyle={!searching ? { ...styles.borderBottom, borderColor: themes[theme].separatorColor } : {}}
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
			fileInfo: file, loading, searching, error
		} = this.state;
		const { theme } = this.props;

		if (loading) {
			return <ActivityIndicator theme={theme} />;
		}

		return (
			<View style={[styles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}>
				{ !searching
					? (
						<>
							{this.renderSelectServer()}
						</>
					)
					: null
				}
				<View style={[styles.container, styles.centered, { backgroundColor: themes[theme].auxiliaryBackground }]}>
					<Text style={[styles.title, { color: themes[theme].titleText }]}>{I18n.t(error)}</Text>
					<CustomIcon name='cancel' size={120} color={themes[theme].dangerColor} />
					<Text style={[styles.fileMime, { color: themes[theme].titleText }]}>{ file.mime }</Text>
				</View>
			</View>
		);
	}

	render() {
		const { showError } = this.state;
		const { theme } = this.props;
		return (
			<SafeAreaView theme={theme}>
				<StatusBar theme={theme} />
				{ showError ? this.renderError() : this.renderContent() }
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (({ share }) => ({
	userId: share.user && share.user.id,
	token: share.user && share.user.token,
	server: share.server
}));

export default connect(mapStateToProps)(withTheme(ShareListView));
