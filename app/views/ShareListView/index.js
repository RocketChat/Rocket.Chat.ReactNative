import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, FlatList, Keyboard, BackHandler, PermissionsAndroid, ScrollView
} from 'react-native';
import ShareExtension from 'rn-extensions-share';
import * as FileSystem from 'expo-file-system';
import { connect } from 'react-redux';
import * as mime from 'react-native-mime-types';
import isEqual from 'react-fast-compare';
import { Q } from '@nozbe/watermelondb';

import database from '../../lib/database';
import { isIOS, isAndroid } from '../../utils/deviceInfo';
import I18n from '../../i18n';
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
import RocketChat from '../../lib/rocketchat';

const permission = {
	title: I18n.t('Read_External_Permission'),
	message: I18n.t('Read_External_Permission_Message')
};

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
		this.chats = [];
		this.state = {
			searching: false,
			searchText: '',
			searchResults: [],
			chats: [],
			servers: [],
			attachments: [],
			text: '',
			loading: true,
			serverInfo: null,
			needsPermission: isAndroid || false
		};
		this.setHeader();
		this.unsubscribeFocus = props.navigation.addListener('focus', () => BackHandler.addEventListener('hardwareBackPress', this.handleBackPress));
		this.unsubscribeBlur = props.navigation.addListener('blur', () => BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress));
	}

	async componentDidMount() {
		const { server } = this.props;
		try {
			const data = await ShareExtension.data();
			if (isAndroid) {
				await this.askForPermission(data);
			}
			const info = await Promise.all(data.filter(item => item.type === 'media').map(file => FileSystem.getInfoAsync(this.uriToPath(file.value), { size: true })));
			const attachments = info.map(file => ({
				filename: file.uri.substring(file.uri.lastIndexOf('/') + 1),
				description: '',
				size: file.size,
				mime: mime.lookup(file.uri),
				path: file.uri
			}));
			const text = data.filter(item => item.type === 'text').reduce((acc, item) => `${ item.value }\n${ acc }`, '');
			this.setState({
				text,
				attachments
			});
		} catch {
			// Do nothing
		}

		this.getSubscriptions(server);
	}

	UNSAFE_componentWillReceiveProps(nextProps) {
		const { server } = this.props;
		if (nextProps.server !== server) {
			this.getSubscriptions(nextProps.server);
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { searching, needsPermission } = this.state;
		if (nextState.searching !== searching) {
			return true;
		}
		if (nextState.needsPermission !== needsPermission) {
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
						<Item title='cancel' iconName='close' onPress={this.cancelSearch} />
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
							<Item title='search' iconName='search' onPress={this.initSearch} />
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

	query = (text) => {
		const db = database.active;
		const defaultWhereClause = [
			Q.where('archived', false),
			Q.where('open', true),
			Q.experimentalSkip(0),
			Q.experimentalTake(50),
			Q.experimentalSortBy('room_updated_at', Q.desc)
		];
		if (text) {
			return db.collections
				.get('subscriptions')
				.query(
					...defaultWhereClause,
					Q.or(
						Q.where('name', Q.like(`%${ Q.sanitizeLikeString(text) }%`)),
						Q.where('fname', Q.like(`%${ Q.sanitizeLikeString(text) }%`))
					)
				).fetch();
		}
		return db.collections.get('subscriptions').query(...defaultWhereClause).fetch();
	}

	getSubscriptions = async(server) => {
		const serversDB = database.servers;

		if (server) {
			this.chats = await this.query();
			const serversCollection = serversDB.collections.get('servers');
			this.servers = await serversCollection.query().fetch();
			let serverInfo = {};
			try {
				serverInfo = await serversCollection.find(server);
			} catch (error) {
				// Do nothing
			}

			this.internalSetState({
				chats: this.chats ?? [],
				servers: this.servers ?? [],
				loading: false,
				serverInfo
			});
			this.forceUpdate();
		}
	};

	askForPermission = async(data) => {
		const mediaIndex = data.findIndex(item => item.type === 'media');
		if (mediaIndex !== -1) {
			const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE, permission);
			if (result !== PermissionsAndroid.RESULTS.GRANTED) {
				this.setState({ needsPermission: true });
				return Promise.reject();
			}
		}
		this.setState({ needsPermission: false });
		return Promise.resolve();
	}

	uriToPath = uri => decodeURIComponent(isIOS ? uri.replace(/^file:\/\//, '') : uri);

	getRoomTitle = (item) => {
		const { serverInfo } = this.state;
		const { useRealName } = serverInfo;
		return ((item.prid || useRealName) && item.fname) || item.name;
	}

	shareMessage = (room) => {
		const { attachments, text, serverInfo } = this.state;
		const { navigation } = this.props;

		navigation.navigate('ShareView', {
			room,
			text,
			attachments,
			serverInfo,
			isShareExtension: true
		});
	}

	search = async(text) => {
		const result = await this.query(text);
		this.internalSetState({
			searchResults: result,
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
		const { serverInfo } = this.state;
		const { useRealName } = serverInfo;
		const {
			userId, token, server, theme
		} = this.props;
		let description;
		switch (item.t) {
			case 'c':
				description = item.topic || item.description;
				break;
			case 'p':
				description = item.topic || item.description;
				break;
			case 'd':
				description = useRealName ? item.name : item.fname;
				break;
			default:
				description = item.fname;
				break;
		}
		return (
			<DirectoryItem
				user={{
					id: userId,
					token
				}}
				title={this.getRoomTitle(item)}
				baseUrl={server}
				avatar={RocketChat.getRoomAvatar(item)}
				description={description}
				type={item.prid ? 'discussion' : item.t}
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
			chats, loading, searchResults, searching, searchText, needsPermission
		} = this.state;
		const { theme } = this.props;

		if (loading) {
			return <ActivityIndicator theme={theme} />;
		}

		if (needsPermission) {
			return (
				<ScrollView
					style={{ backgroundColor: themes[theme].auxiliaryBackground }}
					contentContainerStyle={[styles.container, styles.centered, { backgroundColor: themes[theme].backgroundColor }]}
				>
					<Text style={[styles.permissionTitle, { color: themes[theme].titleText }]}>{permission.title}</Text>
					<Text style={[styles.permissionMessage, { color: themes[theme].bodyText }]}>{permission.message}</Text>
				</ScrollView>
			);
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

	render() {
		const { theme } = this.props;
		return (
			<SafeAreaView theme={theme}>
				<StatusBar theme={theme} />
				{this.renderContent()}
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
