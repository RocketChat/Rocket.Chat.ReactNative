import React from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { BackHandler, FlatList, Keyboard, PermissionsAndroid, ScrollView, Text, View, Rationale } from 'react-native';
import ShareExtension from 'rn-extensions-share';
import * as FileSystem from 'expo-file-system';
import { connect } from 'react-redux';
import * as mime from 'react-native-mime-types';
import { dequal } from 'dequal';
import { Q } from '@nozbe/watermelondb';

import database from '../../lib/database';
import I18n from '../../i18n';
import DirectoryItem, { ROW_HEIGHT } from '../../containers/DirectoryItem';
import ServerItem from '../../containers/ServerItem';
import * as HeaderButton from '../../containers/HeaderButton';
import ActivityIndicator from '../../containers/ActivityIndicator';
import * as List from '../../containers/List';
import { themes } from '../../lib/constants';
import { animateNextTransition } from '../../lib/methods/helpers/layoutAnimation';
import { TSupportedThemes, withTheme } from '../../theme';
import SafeAreaView from '../../containers/SafeAreaView';
import { sanitizeLikeString } from '../../lib/database/utils';
import styles from './styles';
import ShareListHeader from './Header';
import { TServerModel, TSubscriptionModel } from '../../definitions';
import { ShareInsideStackParamList } from '../../definitions/navigationTypes';
import { getRoomAvatar, isAndroid, isIOS } from '../../lib/methods/helpers';

interface IDataFromShare {
	value: string;
	type: string;
}

interface IFileToShare {
	filename: string;
	description: string;
	size: number;
	mime: string;
	path: string;
}

interface IState {
	searching: boolean;
	searchText: string;
	searchResults: TSubscriptionModel[];
	chats: TSubscriptionModel[];
	serversCount: number;
	attachments: IFileToShare[];
	text: string;
	loading: boolean;
	serverInfo: TServerModel;
	needsPermission: boolean;
}

interface INavigationOption {
	navigation: StackNavigationProp<ShareInsideStackParamList, 'ShareListView'>;
}

interface IShareListViewProps extends INavigationOption {
	server: string;
	token: string;
	userId: string;
	theme: TSupportedThemes;
}

const permission: Rationale = {
	title: I18n.t('Read_External_Permission'),
	message: I18n.t('Read_External_Permission_Message'),
	buttonPositive: 'Ok'
};

const getItemLayout = (data: any, index: number) => ({ length: data.length, offset: ROW_HEIGHT * index, index });
const keyExtractor = (item: TSubscriptionModel) => item.rid;

class ShareListView extends React.Component<IShareListViewProps, IState> {
	private unsubscribeFocus: (() => void) | undefined;

	private unsubscribeBlur: (() => void) | undefined;

	constructor(props: IShareListViewProps) {
		super(props);
		this.state = {
			searching: false,
			searchText: '',
			searchResults: [],
			chats: [],
			serversCount: 0,
			attachments: [],
			text: '',
			loading: true,
			serverInfo: {} as TServerModel,
			needsPermission: isAndroid || false
		};
		this.setHeader();
		if (isAndroid) {
			this.unsubscribeFocus = props.navigation.addListener('focus', () =>
				BackHandler.addEventListener('hardwareBackPress', this.handleBackPress)
			);
			this.unsubscribeBlur = props.navigation.addListener('blur', () =>
				BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress)
			);
		}
	}

	async componentDidMount() {
		const { server } = this.props;
		try {
			const data = (await ShareExtension.data()) as IDataFromShare[];
			if (isAndroid) {
				await this.askForPermission(data);
			}
			const info = await Promise.all(
				data
					.filter(item => item.type === 'media')
					.map(file => FileSystem.getInfoAsync(this.uriToPath(file.value), { size: true }))
			);
			const attachments = info.map(file => ({
				filename: decodeURIComponent(file.uri.substring(file.uri.lastIndexOf('/') + 1)),
				description: '',
				size: file.size,
				mime: mime.lookup(file.uri),
				path: file.uri
			})) as IFileToShare[];
			const text = data.filter(item => item.type === 'text').reduce((acc, item) => `${item.value}\n${acc}`, '');
			this.setState({
				text,
				attachments
			});
		} catch {
			// Do nothing
		}

		this.getSubscriptions(server);
	}

	UNSAFE_componentWillReceiveProps(nextProps: IShareListViewProps) {
		const { server } = this.props;
		if (nextProps.server !== server) {
			this.getSubscriptions(nextProps.server);
		}
	}

	shouldComponentUpdate(nextProps: IShareListViewProps, nextState: IState) {
		const { searching, needsPermission } = this.state;
		if (nextState.searching !== searching) {
			return true;
		}
		if (nextState.needsPermission !== needsPermission) {
			return true;
		}

		const { server, userId } = this.props;
		if (server !== nextProps.server) {
			return true;
		}
		if (userId !== nextProps.userId) {
			return true;
		}

		const { searchResults } = this.state;
		if (nextState.searching) {
			if (!dequal(nextState.searchResults, searchResults)) {
				return true;
			}
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
						onChangeSearchText={this.search}
						theme={theme}
					/>
				)
			});
			return;
		}

		navigation.setOptions({
			headerLeft: () =>
				searching ? (
					<HeaderButton.Container left>
						<HeaderButton.Item title='cancel' iconName='close' onPress={this.cancelSearch} />
					</HeaderButton.Container>
				) : (
					<HeaderButton.CancelModal onPress={ShareExtension.close} testID='share-extension-close' />
				),
			headerTitle: () => <ShareListHeader searching={searching} onChangeSearchText={this.search} theme={theme} />,
			headerRight: () =>
				searching ? null : (
					<HeaderButton.Container>
						<HeaderButton.Item iconName='search' onPress={this.initSearch} />
					</HeaderButton.Container>
				)
		});
	};

	internalSetState = (...args: object[]) => {
		const { navigation } = this.props;
		if (navigation.isFocused()) {
			animateNextTransition();
		}
		// @ts-ignore
		this.setState(...args);
	};

	query = async (text?: string) => {
		const db = database.active;
		const defaultWhereClause = [
			Q.where('archived', false),
			Q.where('open', true),
			Q.experimentalSkip(0),
			Q.experimentalTake(20),
			Q.experimentalSortBy('room_updated_at', Q.desc)
		] as (Q.WhereDescription | Q.Skip | Q.Take | Q.SortBy | Q.Or)[];
		if (text) {
			const likeString = sanitizeLikeString(text);
			defaultWhereClause.push(Q.or(Q.where('name', Q.like(`%${likeString}%`)), Q.where('fname', Q.like(`%${likeString}%`))));
		}
		const data = (await db
			.get('subscriptions')
			.query(...defaultWhereClause)
			.fetch()) as TSubscriptionModel[];

		return data.map(item => ({
			rid: item.rid,
			t: item.t,
			name: item.name,
			fname: item.fname,
			blocked: item.blocked,
			blocker: item.blocker,
			prid: item.prid,
			uids: item.uids,
			usernames: item.usernames,
			topic: item.topic,
			teamMain: item.teamMain
		}));
	};

	getSubscriptions = async (server: string) => {
		const serversDB = database.servers;

		if (server) {
			const chats = await this.query();
			const serversCollection = serversDB.get('servers');
			const serversCount = await serversCollection.query(Q.where('rooms_updated_at', Q.notEq(null))).fetchCount();
			let serverInfo = {};
			try {
				serverInfo = await serversCollection.find(server);
			} catch (error) {
				// Do nothing
			}

			this.internalSetState({
				chats: chats ?? [],
				serversCount,
				loading: false,
				serverInfo
			});
			this.forceUpdate();
		}
	};

	askForPermission = async (data: IDataFromShare[]) => {
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
	};

	uriToPath = (uri: string) => decodeURIComponent(isIOS ? uri.replace(/^file:\/\//, '') : uri);

	getRoomTitle = (item: TSubscriptionModel) => {
		const { serverInfo } = this.state;
		return ((item.prid || serverInfo?.useRealName) && item.fname) || item.name;
	};

	shareMessage = (room: TSubscriptionModel) => {
		const { attachments, text, serverInfo } = this.state;
		const { navigation } = this.props;

		navigation.navigate('ShareView', {
			room,
			text,
			attachments,
			serverInfo,
			isShareExtension: true
		});
	};

	search = async (text: string) => {
		const result = await this.query(text);
		this.internalSetState({
			searchResults: result,
			searchText: text
		});
	};

	initSearch = () => {
		const { chats } = this.state;
		this.setState({ searching: true, searchResults: chats }, () => this.setHeader());
	};

	cancelSearch = () => {
		this.internalSetState({ searching: false, searchResults: [], searchText: '' }, () => this.setHeader());
		Keyboard.dismiss();
	};

	handleBackPress = () => {
		const { searching } = this.state;
		if (searching) {
			this.cancelSearch();
			return true;
		}
		return false;
	};

	renderSectionHeader = (header: string) => {
		const { searching } = this.state;
		const { theme } = this.props;
		if (searching) {
			return null;
		}

		return (
			<>
				<View style={[styles.headerContainer, { backgroundColor: themes[theme].auxiliaryBackground }]}>
					<Text style={[styles.headerText, { color: themes[theme].titleText }]}>{I18n.t(header)}</Text>
				</View>
				<List.Separator />
			</>
		);
	};

	renderItem = ({ item }: { item: TSubscriptionModel }) => {
		const { serverInfo } = this.state;
		let description;
		switch (item.t) {
			case 'c':
				description = item.topic || item.description;
				break;
			case 'p':
				description = item.topic || item.description;
				break;
			case 'd':
				description = serverInfo?.useRealName ? item.name : item.fname;
				break;
			default:
				description = item.fname;
				break;
		}
		return (
			<DirectoryItem
				title={this.getRoomTitle(item)}
				avatar={getRoomAvatar(item)}
				description={description}
				type={item.prid ? 'discussion' : item.t}
				onPress={() => this.shareMessage(item)}
				testID={`share-extension-item-${item.name}`}
				teamMain={item.teamMain}
			/>
		);
	};

	renderSelectServer = () => {
		const { serverInfo } = this.state;
		const { navigation } = this.props;
		return (
			<>
				{this.renderSectionHeader('Select_Server')}
				<ServerItem onPress={() => navigation.navigate('SelectServerView')} item={serverInfo} />
				<List.Separator />
			</>
		);
	};

	renderEmptyComponent = () => {
		const { theme } = this.props;
		return (
			<View style={[styles.container, styles.emptyContainer, { backgroundColor: themes[theme].auxiliaryBackground }]}>
				<Text style={[styles.title, { color: themes[theme].titleText }]}>{I18n.t('No_results_found')}</Text>
			</View>
		);
	};

	renderHeader = () => {
		const { searching, serversCount } = this.state;

		if (searching) {
			return null;
		}

		if (serversCount === 1) {
			return this.renderSectionHeader('Chats');
		}

		return (
			<>
				{this.renderSelectServer()}
				{this.renderSectionHeader('Chats')}
			</>
		);
	};

	render = () => {
		const { chats, loading, searchResults, searching, searchText, needsPermission } = this.state;
		const { theme } = this.props;

		if (loading) {
			return <ActivityIndicator />;
		}

		if (needsPermission) {
			return (
				<SafeAreaView>
					<ScrollView
						style={{ backgroundColor: themes[theme].backgroundColor }}
						contentContainerStyle={[styles.container, styles.centered, { backgroundColor: themes[theme].backgroundColor }]}
					>
						<Text style={[styles.permissionTitle, { color: themes[theme].titleText }]}>{permission.title}</Text>
						<Text style={[styles.permissionMessage, { color: themes[theme].bodyText }]}>{permission.message}</Text>
					</ScrollView>
				</SafeAreaView>
			);
		}

		return (
			<SafeAreaView>
				<FlatList
					data={searching ? searchResults : chats}
					keyExtractor={keyExtractor}
					style={[styles.flatlist, { backgroundColor: themes[theme].auxiliaryBackground }]}
					contentContainerStyle={{ backgroundColor: themes[theme].backgroundColor }}
					renderItem={this.renderItem}
					getItemLayout={getItemLayout}
					ItemSeparatorComponent={List.Separator}
					ListHeaderComponent={this.renderHeader}
					ListFooterComponent={!searching || searchResults.length > 0 ? <List.Separator /> : null}
					ListEmptyComponent={searching && searchText ? this.renderEmptyComponent : null}
					removeClippedSubviews
					keyboardShouldPersistTaps='always'
				/>
			</SafeAreaView>
		);
	};
}

const mapStateToProps = ({ share }: any) => ({
	userId: share.user && share.user.id,
	token: share.user && share.user.token,
	server: share.server.server
});

export default connect(mapStateToProps)(withTheme(ShareListView));
