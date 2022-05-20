import React from 'react';
import { StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/core';
import { FlatList, Text, View } from 'react-native';
import { Q } from '@nozbe/watermelondb';
import { connect } from 'react-redux';
import { dequal } from 'dequal';

import { ISubscription, SubscriptionType } from '../../definitions/ISubscription';
import { IAttachment } from '../../definitions/IAttachment';
import FormTextInput from '../../containers/TextInput/FormTextInput';
import ActivityIndicator from '../../containers/ActivityIndicator';
import Markdown from '../../containers/markdown';
import debounce from '../../utils/debounce';
import Message from '../../containers/message';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { IMessage } from '../../containers/message/interfaces';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import log from '../../utils/log';
import { themes } from '../../lib/constants';
import { TSupportedThemes, withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import * as HeaderButton from '../../containers/HeaderButton';
import database from '../../lib/database';
import { sanitizeLikeString } from '../../lib/database/utils';
import getThreadName from '../../lib/methods/getThreadName';
import getRoomInfo, { IRoomInfoResult } from '../../lib/methods/getRoomInfo';
import { isIOS } from '../../utils/deviceInfo';
import styles from './styles';
import { InsideStackParamList, ChatsStackParamList } from '../../stacks/types';
import { IEmoji } from '../../definitions/IEmoji';
import { compareServerVersion } from '../../lib/methods/helpers/compareServerVersion';
import { IUrl } from '../../definitions';
import { Services } from '../../lib/services';

const QUERY_SIZE = 50;

interface ISearchMessagesViewState {
	loading: boolean;
	messages: IMessage[];
	searchText: string;
}

export interface IRoomInfoParam {
	room?: ISubscription;
	member?: any;
	rid: string;
	t: SubscriptionType;
	joined?: boolean;
}

interface INavigationOption {
	navigation: CompositeNavigationProp<
		StackNavigationProp<ChatsStackParamList, 'SearchMessagesView'>,
		StackNavigationProp<InsideStackParamList>
	>;
	route: RouteProp<ChatsStackParamList, 'SearchMessagesView'>;
}

interface ISearchMessagesViewProps extends INavigationOption {
	user: {
		id: string;
		username: string;
		token: string;
	};
	baseUrl: string;
	serverVersion: string;
	customEmojis: {
		[key: string]: IEmoji;
	};
	theme: TSupportedThemes;
	useRealName: boolean;
}
class SearchMessagesView extends React.Component<ISearchMessagesViewProps, ISearchMessagesViewState> {
	private offset: number;

	private rid: string;

	private t: string | undefined;

	private encrypted: boolean | undefined;

	private room?: IRoomInfoResult;

	static navigationOptions = ({ navigation, route }: INavigationOption) => {
		const options: StackNavigationOptions = {
			title: I18n.t('Search')
		};
		const showCloseModal = route.params?.showCloseModal;
		if (showCloseModal) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} />;
		}
		return options;
	};

	constructor(props: ISearchMessagesViewProps) {
		super(props);
		this.state = {
			loading: false,
			messages: [],
			searchText: ''
		};
		this.offset = 0;
		this.rid = props.route.params.rid;
		this.t = props.route.params?.t;
		this.encrypted = props.route.params?.encrypted;
	}

	async componentDidMount() {
		this.room = (await getRoomInfo(this.rid)) ?? undefined;
	}

	shouldComponentUpdate(nextProps: ISearchMessagesViewProps, nextState: ISearchMessagesViewState) {
		const { loading, searchText, messages } = this.state;
		const { theme } = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextState.loading !== loading) {
			return true;
		}
		if (nextState.searchText !== searchText) {
			return true;
		}
		if (!dequal(nextState.messages, messages)) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		this.searchDebounced?.stop?.();
	}

	// Handle encrypted rooms search messages
	searchMessages = async (searchText: string) => {
		if (!searchText) {
			return [];
		}
		// If it's a encrypted, room we'll search only on the local stored messages
		if (this.encrypted) {
			const db = database.active;
			const messagesCollection = db.get('messages');
			const likeString = sanitizeLikeString(searchText);
			return messagesCollection
				.query(
					// Messages of this room
					Q.where('rid', this.rid),
					// Message content is like the search text
					Q.where('msg', Q.like(`%${likeString}%`))
				)
				.fetch();
		}
		// If it's not a encrypted room, search messages on the server
		const result = await Services.searchMessages(this.rid, searchText, QUERY_SIZE, this.offset);
		if (result.success) {
			const urlRenderMessages = result.messages?.map(message => {
				if (message.urls && message.urls.length > 0) {
					message.urls = message.urls?.map((url, index) => {
						if (url.meta) {
							return {
								_id: index,
								title: url.meta.pageTitle,
								description: url.meta.ogDescription,
								image: url.meta.ogImage,
								url: url.url
							} as IUrl;
						}
						return {} as IUrl;
					});
				}
				return message;
			});
			return urlRenderMessages;
		}
		return [];
	};
	getMessages = async (searchText: string, debounced?: boolean) => {
		try {
			const messages = await this.searchMessages(searchText);
			// @ts-ignore TODO: find a way to deal with the difference between IMessageFromServer and TMessageModel expected by state
			this.setState(prevState => ({
				messages: debounced ? messages : [...prevState.messages, ...messages],
				loading: false
			}));
		} catch (e) {
			this.setState({ loading: false });
			log(e);
		}
	};

	search = (searchText: string) => {
		this.offset = 0;
		this.setState({ searchText, loading: true, messages: [] });
		this.searchDebounced(searchText);
	};

	searchDebounced = debounce(async (searchText: string) => {
		await this.getMessages(searchText, true);
	}, 1000);

	getCustomEmoji = (name: string) => {
		const { customEmojis } = this.props;
		const emoji = customEmojis[name];
		if (emoji) {
			return emoji;
		}
		return null;
	};

	showAttachment = (attachment: IAttachment) => {
		const { navigation } = this.props;
		navigation.navigate('AttachmentView', { attachment });
	};

	navToRoomInfo = (navParam: IRoomInfoParam) => {
		const { navigation, user } = this.props;
		if (navParam.rid === user.id) {
			return;
		}
		navigation.navigate('RoomInfoView', navParam);
	};

	jumpToMessage = async ({ item }: { item: IMessage }) => {
		const { navigation } = this.props;
		let params: any = {
			rid: this.rid,
			jumpToMessageId: item._id,
			t: this.t,
			room: this.room
		};
		if (item.tmid) {
			navigation.pop();
			params = {
				...params,
				tmid: item.tmid,
				name: await getThreadName(this.rid, item.tmid, item._id),
				t: 'thread'
			};
			navigation.push('RoomView', params);
		} else {
			navigation.navigate('RoomView', params);
		}
	};

	onEndReached = async () => {
		const { serverVersion } = this.props;
		const { searchText, messages, loading } = this.state;
		if (
			messages.length < this.offset ||
			this.encrypted ||
			loading ||
			compareServerVersion(serverVersion, 'lowerThan', '3.17.0')
		) {
			return;
		}
		this.setState({ loading: true });
		this.offset += QUERY_SIZE;

		await this.getMessages(searchText);
	};

	renderEmpty = () => {
		const { theme } = this.props;
		return (
			<View style={[styles.listEmptyContainer, { backgroundColor: themes[theme].backgroundColor }]}>
				<Text style={[styles.noDataFound, { color: themes[theme].titleText }]}>{I18n.t('No_results_found')}</Text>
			</View>
		);
	};

	renderItem = ({ item }: { item: IMessage }) => {
		const { user, baseUrl, theme, useRealName } = this.props;
		return (
			<Message
				// @ts-ignore IMessage | TMessageModel?
				item={item}
				baseUrl={baseUrl}
				user={user}
				timeFormat='MMM Do YYYY, h:mm:ss a'
				isHeader
				isThreadRoom
				showAttachment={this.showAttachment}
				getCustomEmoji={this.getCustomEmoji}
				navToRoomInfo={this.navToRoomInfo}
				useRealName={useRealName}
				theme={theme}
				onPress={() => this.jumpToMessage({ item })}
				jumpToMessage={() => this.jumpToMessage({ item })}
			/>
		);
	};

	renderList = () => {
		const { messages, loading, searchText } = this.state;
		const { theme } = this.props;

		if (!loading && messages.length === 0 && searchText.length) {
			return this.renderEmpty();
		}

		return (
			<FlatList
				data={messages}
				renderItem={this.renderItem}
				style={[styles.list, { backgroundColor: themes[theme].backgroundColor }]}
				keyExtractor={item => item._id}
				onEndReached={this.onEndReached}
				ListFooterComponent={loading ? <ActivityIndicator /> : null}
				onEndReachedThreshold={0.5}
				removeClippedSubviews={isIOS}
				{...scrollPersistTaps}
			/>
		);
	};

	render() {
		const { theme } = this.props;
		return (
			<SafeAreaView style={{ backgroundColor: themes[theme].backgroundColor }} testID='search-messages-view'>
				<StatusBar />
				<View style={styles.searchContainer}>
					<FormTextInput
						autoFocus
						label={I18n.t('Search')}
						onChangeText={this.search}
						placeholder={I18n.t('Search_Messages')}
						testID='search-message-view-input'
						theme={theme}
					/>
					<Markdown msg={I18n.t('You_can_search_using_RegExp_eg')} theme={theme} />
					<View style={[styles.divider, { backgroundColor: themes[theme].separatorColor }]} />
				</View>
				{this.renderList()}
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: any) => ({
	serverVersion: state.server.version,
	baseUrl: state.server.server,
	user: getUserSelector(state),
	useRealName: state.settings.UI_Use_Real_Name,
	customEmojis: state.customEmojis
});

export default connect(mapStateToProps)(withTheme(SearchMessagesView));
