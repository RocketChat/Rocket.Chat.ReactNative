import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, View, Text } from 'react-native';
import { connect } from 'react-redux';
import { dequal } from 'dequal';

import styles from './styles';
import Message from '../../containers/message';
import ActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';
import RocketChat from '../../lib/rocketchat';
import StatusBar from '../../containers/StatusBar';
import getFileUrlFromMessage from '../../lib/methods/helpers/getFileUrlFromMessage';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import { withActionSheet } from '../../containers/ActionSheet';
import SafeAreaView from '../../containers/SafeAreaView';
import getThreadName from '../../lib/methods/getThreadName';

class MessagesView extends React.Component {
	static propTypes = {
		user: PropTypes.object,
		baseUrl: PropTypes.string,
		navigation: PropTypes.object,
		route: PropTypes.object,
		customEmojis: PropTypes.object,
		theme: PropTypes.string,
		showActionSheet: PropTypes.func,
		useRealName: PropTypes.bool,
		isMasterDetail: PropTypes.bool
	}

	constructor(props) {
		super(props);
		this.state = {
			loading: false,
			messages: [],
			fileLoading: true
		};
		this.setHeader();
		this.rid = props.route.params?.rid;
		this.t = props.route.params?.t;
		this.content = this.defineMessagesViewContent(props.route.params?.name);
	}

	componentDidMount() {
		this.load();
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {
			loading, messages, fileLoading
		} = this.state;
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
	}

	navToRoomInfo = (navParam) => {
		const { navigation, user } = this.props;
		if (navParam.rid === user.id) {
			return;
		}
		navigation.navigate('RoomInfoView', navParam);
	}

	jumpToMessage = async({ item }) => {
		const { navigation, isMasterDetail } = this.props;
		let params = {
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
				t: 'thread'
			};
			navigation.push('RoomView', params);
		} else {
			navigation.navigate('RoomView', params);
		}
	}

	defineMessagesViewContent = (name) => {
		const {
			user, baseUrl, theme, useRealName
		} = this.props;
		const renderItemCommonProps = item => ({
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
			onPress: () => this.jumpToMessage({ item })
		});

		return ({
			// Files Messages Screen
			Files: {
				name: I18n.t('Files'),
				fetchFunc: async() => {
					const { messages } = this.state;
					const result = await RocketChat.getFiles(this.rid, this.t, messages.length);
					return { ...result, messages: result.files };
				},
				noDataMsg: I18n.t('No_files'),
				testID: 'room-files-view',
				renderItem: item => (
					<Message
						{...renderItemCommonProps(item)}
						item={{
							...item,
							u: item.user,
							ts: item.ts || item.uploadedAt,
							attachments: [{
								title: item.name,
								description: item.description,
								...getFileUrlFromMessage(item)
							}]
						}}
						theme={theme}
					/>
				)
			},
			// Mentions Messages Screen
			Mentions: {
				name: I18n.t('Mentions'),
				fetchFunc: () => {
					const { messages } = this.state;
					return RocketChat.getMessages(
						this.rid,
						this.t,
						{ 'mentions._id': { $in: [user.id] } },
						messages.length
					);
				},
				noDataMsg: I18n.t('No_mentioned_messages'),
				testID: 'mentioned-messages-view',
				renderItem: item => (
					<Message
						{...renderItemCommonProps(item)}
						msg={item.msg}
						theme={theme}
					/>
				)
			},
			// Starred Messages Screen
			Starred: {
				name: I18n.t('Starred'),
				fetchFunc: () => {
					const { messages } = this.state;
					return RocketChat.getMessages(
						this.rid,
						this.t,
						{ 'starred._id': { $in: [user.id] } },
						messages.length
					);
				},
				noDataMsg: I18n.t('No_starred_messages'),
				testID: 'starred-messages-view',
				renderItem: item => (
					<Message
						{...renderItemCommonProps(item)}
						msg={item.msg}
						onLongPress={() => this.onLongPress(item)}
						theme={theme}
					/>
				),
				action: message => ({ title: I18n.t('Unstar'), icon: message.starred ? 'star-filled' : 'star', onPress: this.handleActionPress }),
				handleActionPress: message => RocketChat.toggleStarMessage(message._id, message.starred)
			},
			// Pinned Messages Screen
			Pinned: {
				name: I18n.t('Pinned'),
				fetchFunc: () => {
					const { messages } = this.state;
					return RocketChat.getMessages(this.rid, this.t, { pinned: true }, messages.length);
				},
				noDataMsg: I18n.t('No_pinned_messages'),
				testID: 'pinned-messages-view',
				renderItem: item => (
					<Message
						{...renderItemCommonProps(item)}
						msg={item.msg}
						onLongPress={() => this.onLongPress(item)}
						theme={theme}
					/>
				),
				action: () => ({ title: I18n.t('Unpin'), icon: 'pin', onPress: this.handleActionPress }),
				handleActionPress: message => RocketChat.togglePinMessage(message._id, message.pinned)
			}
		}[name]);
	}

	load = async() => {
		const {
			messages, total, loading
		} = this.state;
		if (messages.length === total || loading) {
			return;
		}

		this.setState({ loading: true });

		try {
			const result = await this.content.fetchFunc();
			if (result.success) {
				this.setState({
					messages: [...messages, ...result.messages],
					total: result.total,
					loading: false
				});
			}
		} catch (error) {
			this.setState({ loading: false });
			console.warn('MessagesView -> catch -> error', error);
		}
	}

	getCustomEmoji = (name) => {
		const { customEmojis } = this.props;
		const emoji = customEmojis[name];
		if (emoji) {
			return emoji;
		}
		return null;
	}

	showAttachment = (attachment) => {
		const { navigation } = this.props;
		navigation.navigate('AttachmentView', { attachment });
	}

	onLongPress = (message) => {
		this.setState({ message }, this.showActionSheet);
	}

	showActionSheet = () => {
		const { message } = this.state;
		const { showActionSheet } = this.props;
		showActionSheet({ options: [this.content.action(message)], hasCancel: true });
	}

	handleActionPress = async() => {
		const { message } = this.state;

		try {
			const result = await this.content.handleActionPress(message);
			if (result.success) {
				this.setState(prevState => ({
					messages: prevState.messages.filter(item => item._id !== message._id),
					total: prevState.total - 1
				}));
			}
		} catch {
			// Do nothing
		}
	}

	setFileLoading = (fileLoading) => {
		this.setState({ fileLoading });
	}

	renderEmpty = () => {
		const { theme } = this.props;
		return (
			<View
				style={[
					styles.listEmptyContainer,
					{ backgroundColor: themes[theme].backgroundColor }
				]}
				testID={this.content.testID}
			>
				<Text style={[styles.noDataFound, { color: themes[theme].titleText }]}>{this.content.noDataMsg}</Text>
			</View>
		);
	}

	renderItem = ({ item }) => this.content.renderItem(item)

	render() {
		const { messages, loading } = this.state;
		const { theme } = this.props;

		if (!loading && messages.length === 0) {
			return this.renderEmpty();
		}

		return (
			<SafeAreaView
				style={{ backgroundColor: themes[theme].backgroundColor }}
				testID={this.content.testID}
			>
				<StatusBar />
				<FlatList
					data={messages}
					renderItem={this.renderItem}
					style={[styles.list, { backgroundColor: themes[theme].backgroundColor }]}
					keyExtractor={item => item._id}
					onEndReached={this.load}
					ListFooterComponent={loading ? <ActivityIndicator theme={theme} /> : null}
				/>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.server.server,
	user: getUserSelector(state),
	customEmojis: state.customEmojis,
	useRealName: state.settings.UI_Use_Real_Name,
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps)(withTheme(withActionSheet(MessagesView)));
