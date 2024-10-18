import React from 'react';
import { Dispatch } from 'redux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BackHandler, FlatList, Keyboard, Text, View } from 'react-native';
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
import SearchHeader from '../../containers/SearchHeader';
import { themes } from '../../lib/constants';
import { animateNextTransition } from '../../lib/methods/helpers/layoutAnimation';
import { TSupportedThemes, withTheme } from '../../theme';
import SafeAreaView from '../../containers/SafeAreaView';
import { sanitizeLikeString } from '../../lib/database/utils';
import styles from './styles';
import { IApplicationState, RootEnum, TServerModel, TSubscriptionModel } from '../../definitions';
import { ShareInsideStackParamList } from '../../definitions/navigationTypes';
import { getRoomAvatar, isAndroid, isIOS } from '../../lib/methods/helpers';
import { shareSetParams } from '../../actions/share';
import { appStart } from '../../actions/app';

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
}

interface INavigationOption {
	navigation: NativeStackNavigationProp<ShareInsideStackParamList, 'ShareListView'>;
}

interface IShareListViewProps extends INavigationOption {
	server: string;
	connecting: boolean;
	isAuthenticated: boolean;
	token: string;
	userId: string;
	theme: TSupportedThemes;
	airGappedRestrictionRemainingDays: number | undefined;
	shareExtensionParams: Record<string, any>;
	dispatch: Dispatch;
}

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
			text: props.shareExtensionParams.text,
			loading: true,
			serverInfo: {} as TServerModel
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
		const { shareExtensionParams } = this.props;
		const { mediaUris } = shareExtensionParams;
		if (mediaUris) {
			try {
				const info = await Promise.all(mediaUris.split(',').map((uri: string) => FileSystem.getInfoAsync(uri, { size: true })));
				const attachments = info.map(file => {
					if (!file.exists) {
						return null;
					}

					return {
						filename: decodeURIComponent(file.uri.substring(file.uri.lastIndexOf('/') + 1)),
						description: '',
						size: file.size,
						mime: mime.lookup(file.uri),
						path: file.uri
					};
				}) as IFileToShare[];
				this.setState({
					// text,
					attachments
				});
			} catch {
				// Do nothing
			}
		}

		this.getSubscriptions();
	}

	componentDidUpdate(previousProps: IShareListViewProps, previousState: IState) {
		const { searching } = this.state;
		const { server, connecting, isAuthenticated } = this.props;
		if (
			previousProps.server !== server ||
			(previousProps.connecting !== connecting && !connecting) ||
			(previousProps.isAuthenticated !== isAuthenticated && isAuthenticated)
		) {
			this.getSubscriptions();
		}
		if (previousProps.connecting !== connecting && connecting) {
			this.setState({ chats: [], searchResults: [], searching: false, searchText: '' });
		}
		if (previousState.searching !== searching) {
			this.setHeader();
		}
	}

	shouldComponentUpdate(nextProps: IShareListViewProps, nextState: IState) {
		const { searching } = this.state;
		if (nextState.searching !== searching) {
			return true;
		}
		const { server, userId, isAuthenticated, connecting } = this.props;
		if (server !== nextProps.server) {
			return true;
		}
		if (userId !== nextProps.userId) {
			return true;
		}
		if (isAuthenticated !== nextProps.isAuthenticated) {
			return true;
		}
		if (connecting !== nextProps.connecting) {
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
		const { dispatch } = this.props;
		dispatch(shareSetParams({}));
	}

	setHeader = () => {
		const { searching } = this.state;
		const { navigation } = this.props;

		if (searching) {
			navigation.setOptions({
				headerLeft: () => (
					<HeaderButton.Container left>
						<HeaderButton.Item iconName='close' onPress={this.cancelSearch} />
					</HeaderButton.Container>
				),
				headerTitle: () => <SearchHeader onSearchChangeText={this.search} />,
				headerRight: () => null
			});
			return;
		}

		navigation.setOptions({
			headerLeft: () => (
				<HeaderButton.Container left>
					<HeaderButton.Item iconName='close' onPress={this.closeShareExtension} testID='share-extension-close' />
				</HeaderButton.Container>
			),
			headerTitle: I18n.t('Send_to'),
			headerRight: () =>
				this.airGappedReadOnly ? null : (
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
			Q.skip(0),
			Q.take(20),
			Q.sortBy('room_updated_at', Q.desc)
		] as (Q.WhereDescription | Q.Skip | Q.Take | Q.SortBy | Q.Or)[];
		if (text) {
			const likeString = sanitizeLikeString(text);
			defaultWhereClause.push(Q.or(Q.where('name', Q.like(`%${likeString}%`)), Q.where('fname', Q.like(`%${likeString}%`))));
		}
		const data = (await db
			.get('subscriptions')
			.query(...defaultWhereClause)
			.fetch()) as TSubscriptionModel[];

		return data
			.map(item => {
				if (item.encrypted) {
					return null;
				}

				return {
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
				};
			})
			.filter(item => !!item);
	};

	getSubscriptions = async () => {
		const { server, connecting, isAuthenticated } = this.props;
		if (connecting || !isAuthenticated) {
			return;
		}

		if (server) {
			const chats = await this.query();
			const serversDB = database.servers;
			const serversCollection = serversDB.get('servers');
			const serversCount = await serversCollection.query(Q.where('rooms_updated_at', Q.notEq(null))).fetchCount();
			let serverInfo = {};
			try {
				serverInfo = await serversCollection.find(server);
			} catch (error) {
				// Do nothing
			}

			if (this.airGappedReadOnly) {
				this.internalSetState({
					chats: [],
					serversCount,
					loading: false,
					serverInfo
				});
				this.forceUpdate();
				return;
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

	closeShareExtension = () => {
		const { dispatch } = this.props;
		dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
	};

	get airGappedReadOnly() {
		const { airGappedRestrictionRemainingDays } = this.props;
		return airGappedRestrictionRemainingDays !== undefined && airGappedRestrictionRemainingDays === 0;
	}

	renderSectionHeader = (header: string) => {
		const { searching } = this.state;
		const { theme } = this.props;
		if (searching) {
			return null;
		}

		return (
			<>
				<View style={[styles.headerContainer, { backgroundColor: themes[theme].surfaceHover }]}>
					<Text style={[styles.headerText, { color: themes[theme].fontTitlesLabels }]}>{I18n.t(header)}</Text>
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
		const { serverInfo, serversCount } = this.state;
		const { navigation } = this.props;
		if (serversCount === 1) {
			return null;
		}
		return (
			<>
				{this.renderSectionHeader('Select_Server')}
				<ServerItem onPress={() => navigation.navigate('SelectServerView')} item={serverInfo} />
				<List.Separator />
			</>
		);
	};

	renderEmptyComponent = () => {
		const { searching, searchText } = this.state;
		const { theme } = this.props;
		if (searching && searchText) {
			return (
				<View style={[styles.container, styles.emptyContainer, { backgroundColor: themes[theme].surfaceHover }]}>
					<Text style={[styles.title, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('No_results_found')}</Text>
				</View>
			);
		}
		return null;
	};

	renderHeader = () => {
		const { searching } = this.state;

		if (searching) {
			return null;
		}

		return (
			<>
				{this.renderSelectServer()}
				{this.renderSectionHeader('Chats')}
			</>
		);
	};

	render = () => {
		const { chats, loading, searchResults, searching, serversCount } = this.state;
		const { theme } = this.props;

		if (loading) {
			return <ActivityIndicator />;
		}

		if (this.airGappedReadOnly) {
			return (
				<SafeAreaView testID='share-list-view'>
					{this.renderSelectServer()}
					{serversCount > 1 ? (
						<>
							<View style={styles.readOnlyServerSeparator} />
							<List.Separator />
						</>
					) : null}
					<View
						style={[
							styles.readOnlyContainer,
							{
								backgroundColor: themes[theme].surfaceRoom,
								...(serversCount > 1 ? { justifyContent: 'center' } : { paddingTop: 250 })
							}
						]}>
						<Text style={[styles.readOnlyTitle, { color: themes[theme].fontDefault }]}>
							{I18n.t('AirGapped_workspace_read_only_share_extension_title')}
						</Text>
						<Text style={[styles.readOnlyDescription, { color: themes[theme].fontDefault }]}>
							{I18n.t('AirGapped_workspace_read_only_description')}
						</Text>
					</View>
				</SafeAreaView>
			);
		}

		return (
			<SafeAreaView testID='share-list-view'>
				<FlatList
					data={searching ? searchResults : chats}
					keyExtractor={keyExtractor}
					style={[styles.flatlist, { backgroundColor: themes[theme].surfaceHover }]}
					renderItem={this.renderItem}
					getItemLayout={getItemLayout}
					ItemSeparatorComponent={List.Separator}
					ListHeaderComponent={this.renderHeader}
					ListFooterComponent={!searching || searchResults.length > 0 ? <List.Separator /> : null}
					ListEmptyComponent={this.renderEmptyComponent}
					removeClippedSubviews
					keyboardShouldPersistTaps='always'
				/>
			</SafeAreaView>
		);
	};
}

const mapStateToProps = ({ login, server, share, settings }: IApplicationState) => ({
	userId: login?.user?.id as string,
	token: login?.user?.token as string,
	isAuthenticated: login?.isAuthenticated,
	server: server?.server,
	connecting: server?.connecting,
	shareExtensionParams: share?.params,
	airGappedRestrictionRemainingDays:
		typeof settings.Cloud_Workspace_AirGapped_Restrictions_Remaining_Days === 'number'
			? settings.Cloud_Workspace_AirGapped_Restrictions_Remaining_Days
			: undefined
});

export default connect(mapStateToProps)(withTheme(ShareListView));
