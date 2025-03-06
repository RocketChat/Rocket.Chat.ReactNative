import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { connect } from 'react-redux';
import { dequal } from 'dequal';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/core';

import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import Message from '../../containers/message';
import ActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import getFileUrlAndTypeFromMessage from './getFileUrlAndTypeFromMessage';
import { themes } from '../../lib/constants';
import { TSupportedThemes, withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import { withActionSheet } from '../../containers/ActionSheet';
import SafeAreaView from '../../containers/SafeAreaView';
import getThreadName from '../../lib/methods/getThreadName';
import styles from './styles';
import { ChatsStackParamList } from '../../stacks/types';
import { IRoomInfoParam } from '../SearchMessagesView';
import {
	IApplicationState,
	TMessageModel,
	ISubscription,
	SubscriptionType,
	IAttachment,
	IMessage,
	TAnyMessageModel,
	IUrl,
	TGetCustomEmoji,
	ICustomEmoji
} from '../../definitions';
import { Services } from '../../lib/services';
import { TNavigation } from '../../stacks/stackType';
import AudioManager from '../../lib/methods/AudioManager';
import { Encryption } from '../../lib/encryption';

interface IMessagesViewProps {
	user: {
		id: string;
		username: string;
		token: string;
	};
	baseUrl: string;
	navigation: CompositeNavigationProp<
		NativeStackNavigationProp<ChatsStackParamList, 'MessagesView'>,
		NativeStackNavigationProp<MasterDetailInsideStackParamList & TNavigation>
	>;
	route: RouteProp<ChatsStackParamList, 'MessagesView'>;
	customEmojis: { [key: string]: ICustomEmoji };
	theme: TSupportedThemes;
	showActionSheet: (params: { options: string[]; hasCancel: boolean }) => void;
	useRealName: boolean;
	isMasterDetail: boolean;
}

interface IMessagesViewState {
	loading: boolean;
	messages: IMessage[];
	message?: IMessage;
	fileLoading: boolean;
	total: number;
}

interface IParams {
	rid: string;
	t: SubscriptionType;
	tmid?: string;
	message?: TMessageModel;
	name?: string;
	fname?: string;
	prid?: string;
	room?: ISubscription;
	jumpToMessageId?: string;
	jumpToThreadId?: string;
	roomUserId?: string;
}

class MessagesView extends React.Component<IMessagesViewProps, IMessagesViewState> {
	private rid: string;
	private t: SubscriptionType;
	private content: any;
	private room?: ISubscription;

	constructor(props: IMessagesViewProps) {
		super(props);
		this.state = {
			loading: false,
			messages: [],
			fileLoading: true,
			total: -1
		};
		this.setHeader();
		this.rid = props.route.params?.rid;
		this.t = props.route.params?.t;
		this.content = this.defineMessagesViewContent(props.route.params?.name);
	}

	componentDidMount() {
		this.load();
	}

	componentWillUnmount(): void {
		AudioManager.pauseAudio();
	}

	shouldComponentUpdate(nextProps: IMessagesViewProps, nextState: IMessagesViewState) {
		const { loading, messages, fileLoading } = this.state;
		const { theme } = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextState.loading !== loading) {
			return true;
		}
		if (!dequal(nextState.messages, messages)) {
			return true;
		}
		if (fileLoading !== nextState.fileLoading) {
			return true;
		}
		return false;
	}

	setHeader = () => {
		const { route, navigation } = this.props;
		navigation.setOptions({
			title: I18n.t(route.params?.name)
		});
	};

	navToRoomInfo = (navParam: IRoomInfoParam) => {
		const { navigation } = this.props;
		navigation.navigate('RoomInfoView', navParam);
	};

	jumpToMessage = async ({ item }: { item: IMessage }) => {
		const { navigation, isMasterDetail } = this.props;
		let params: IParams = {
			rid: this.rid,
			jumpToMessageId: item._id,
			t: this.t,
			room: this.room
		};
		if (item.tmid) {
			if (isMasterDetail) {
				navigation.navigate('DrawerNavigator');
			} else {
				navigation.pop(2);
			}
			params = {
				...params,
				tmid: item.tmid,
				name: await getThreadName(this.rid, item.tmid, item._id),
				t: SubscriptionType.THREAD
			};
			navigation.push('RoomView', params);
		} else {
			navigation.navigate('RoomView', params);
		}
	};

	defineMessagesViewContent = (name: string) => {
		const { user, baseUrl, theme, useRealName } = this.props;
		const renderItemCommonProps = (item: TAnyMessageModel) => ({
			item,
			baseUrl,
			user,
			author: item.u || item.user,
			timeFormat: 'MMM Do YYYY, h:mm:ss a',
			isEdited: !!item.editedAt,
			isHeader: true,
			isThreadRoom: true,
			attachments: item.attachments || [],
			useRealName,
			showAttachment: this.showAttachment,
			getCustomEmoji: this.getCustomEmoji,
			navToRoomInfo: this.navToRoomInfo,
			onPress: () => this.jumpToMessage({ item }),
			rid: this.rid
		});

		return {
			// Files Messages Screen
			Files: {
				name: I18n.t('Files'),
				fetchFunc: async () => {
					const { messages } = this.state;
					const result = await Services.getFiles(this.rid, this.t, messages.length);
					if (result.success) {
						return { ...result, messages: await Encryption.decryptFiles(result.files) };
					}
				},
				noDataMsg: I18n.t('No_files'),
				testID: 'room-files-view',
				renderItem: (item: any) => (
					<Message
						{...renderItemCommonProps(item)}
						theme={theme}
						item={{
							...item,
							u: item.user,
							ts: item.ts || item.uploadedAt,
							attachments: [
								{
									title: item.name,
									description: item.description,
									...item,
									...getFileUrlAndTypeFromMessage(item)
								}
							]
						}}
					/>
				)
			},
			// Mentions Messages Screen
			Mentions: {
				name: I18n.t('Mentions'),
				fetchFunc: () => {
					const { messages } = this.state;
					return Services.getMessages({ roomId: this.rid, type: this.t, offset: messages.length, mentionIds: [user.id] });
				},
				noDataMsg: I18n.t('No_mentioned_messages'),
				testID: 'mentioned-messages-view',
				renderItem: (item: TAnyMessageModel) => <Message {...renderItemCommonProps(item)} msg={item.msg} theme={theme} />
			},
			// Starred Messages Screen
			Starred: {
				name: I18n.t('Starred'),
				fetchFunc: () => {
					const { messages } = this.state;
					return Services.getMessages({ roomId: this.rid, type: this.t, offset: messages.length, starredIds: [user.id] });
				},
				noDataMsg: I18n.t('No_starred_messages'),
				testID: 'starred-messages-view',
				renderItem: (item: TAnyMessageModel) => (
					<Message {...renderItemCommonProps(item)} msg={item.msg} onLongPress={() => this.onLongPress(item)} theme={theme} />
				),
				action: (message: IMessage) => ({
					title: I18n.t('Unstar'),
					icon: message.starred ? 'star-filled' : 'star',
					onPress: this.handleActionPress
				}),
				handleActionPress: (message: IMessage) => Services.toggleStarMessage(message._id, message.starred)
			},
			// Pinned Messages Screen
			Pinned: {
				name: I18n.t('Pinned'),
				fetchFunc: () => {
					const { messages } = this.state;
					return Services.getMessages({ roomId: this.rid, type: this.t, offset: messages.length, pinned: true });
				},
				noDataMsg: I18n.t('No_pinned_messages'),
				testID: 'pinned-messages-view',
				renderItem: (item: TAnyMessageModel) => (
					<Message {...renderItemCommonProps(item)} msg={item.msg} onLongPress={() => this.onLongPress(item)} theme={theme} />
				),
				action: () => ({ title: I18n.t('Unpin'), icon: 'pin', onPress: this.handleActionPress }),
				handleActionPress: (message: IMessage) => Services.togglePinMessage(message._id, message.pinned)
			}
		}[name];
	};

	load = async () => {
		const { messages, total, loading } = this.state;
		if (messages.length === total || loading) {
			return;
		}

		this.setState({ loading: true });

		try {
			const result = await this.content.fetchFunc();
			if (result.success) {
				const urlRenderMessages = result.messages?.map((message: any) => {
					if (message.urls && message.urls.length > 0) {
						message.urls = message.urls?.map((url: any, index: any) => {
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
					return { ...message };
				});
				this.setState({
					messages: [...messages, ...urlRenderMessages],
					total: result.total,
					loading: false
				});
			}
		} catch (error) {
			this.setState({ loading: false });
			console.error(error);
		}
	};

	getCustomEmoji: TGetCustomEmoji = name => {
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

	onLongPress = (message: IMessage) => {
		this.setState({ message }, this.showActionSheet);
	};

	showActionSheet = () => {
		const { message } = this.state;
		const { showActionSheet } = this.props;
		showActionSheet({ options: [this.content.action(message)], hasCancel: true });
	};

	handleActionPress = async () => {
		const { message } = this.state;

		try {
			const result = await this.content.handleActionPress(message);
			if (result.success) {
				this.setState((prevState: IMessagesViewState) => ({
					messages: prevState.messages.filter((item: IMessage) => item._id !== message?._id),
					total: prevState.total - 1
				}));
			}
		} catch {
			// Do nothing
		}
	};

	setFileLoading = (fileLoading: boolean) => {
		this.setState({ fileLoading });
	};

	renderEmpty = () => {
		const { theme } = this.props;
		return (
			<View style={[styles.listEmptyContainer, { backgroundColor: themes[theme].surfaceRoom }]} testID={this.content.testID}>
				<Text style={[styles.noDataFound, { color: themes[theme].fontTitlesLabels }]}>{this.content.noDataMsg}</Text>
			</View>
		);
	};

	renderItem = ({ item }: { item: IMessage }) => this.content.renderItem(item);

	render() {
		const { messages, loading } = this.state;
		const { theme } = this.props;

		if (!loading && messages.length === 0) {
			return this.renderEmpty();
		}

		return (
			<SafeAreaView style={{ backgroundColor: themes[theme].surfaceRoom }} testID={this.content.testID}>
				<StatusBar />
				<FlatList
					data={messages}
					renderItem={this.renderItem}
					style={[styles.list, { backgroundColor: themes[theme].surfaceRoom }]}
					keyExtractor={item => item._id}
					onEndReached={this.load}
					ListFooterComponent={loading ? <ActivityIndicator /> : null}
				/>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	baseUrl: state.server.server,
	user: getUserSelector(state),
	customEmojis: state.customEmojis,
	useRealName: state.settings.UI_Use_Real_Name,
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps)(withTheme(withActionSheet(MessagesView)));
