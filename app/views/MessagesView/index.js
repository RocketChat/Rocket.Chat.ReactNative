import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, View, Text } from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';
import ActionSheet from 'react-native-action-sheet';

import styles from './styles';
import Message from '../../containers/message/Message';
import ActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';
import RocketChat from '../../lib/rocketchat';
import StatusBar from '../../containers/StatusBar';
import getFileUrlFromMessage from '../../lib/methods/helpers/getFileUrlFromMessage';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { withSplit } from '../../split';
import { themedHeader } from '../../utils/navigation';
import { getUserSelector } from '../../selectors/login';

const ACTION_INDEX = 0;
const CANCEL_INDEX = 1;

class MessagesView extends React.Component {
	static navigationOptions = ({ navigation, screenProps }) => ({
		title: I18n.t(navigation.state.params.name),
		...themedHeader(screenProps.theme)
	});

	static propTypes = {
		user: PropTypes.object,
		baseUrl: PropTypes.string,
		navigation: PropTypes.object,
		customEmojis: PropTypes.object,
		theme: PropTypes.string,
		split: PropTypes.bool
	}

	constructor(props) {
		super(props);
		this.state = {
			loading: false,
			messages: [],
			fileLoading: true
		};
		this.rid = props.navigation.getParam('rid');
		this.t = props.navigation.getParam('t');
		this.content = this.defineMessagesViewContent(props.navigation.getParam('name'));
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
		if (!equal(nextState.messages, messages)) {
			return true;
		}
		if (fileLoading !== nextState.fileLoading) {
			return true;
		}

		return false;
	}

	navToRoomInfo = (navParam) => {
		const { navigation, user } = this.props;
		if (navParam.rid === user.id) {
			return;
		}
		navigation.navigate('RoomInfoView', navParam);
	}

	defineMessagesViewContent = (name) => {
		const { messages } = this.state;
		const { user, baseUrl, theme } = this.props;

		const renderItemCommonProps = item => ({
			baseUrl,
			user,
			author: item.u || item.user,
			ts: item.ts || item.uploadedAt,
			timeFormat: 'MMM Do YYYY, h:mm:ss a',
			isEdited: !!item.editedAt,
			isHeader: true,
			attachments: item.attachments || [],
			showAttachment: this.showAttachment,
			getCustomEmoji: this.getCustomEmoji,
			navToRoomInfo: this.navToRoomInfo
		});

		return ({
			// Files Messages Screen
			Files: {
				name: I18n.t('Files'),
				fetchFunc: async() => {
					const result = await RocketChat.getFiles(this.rid, this.t, messages.length);
					return { ...result, messages: result.files };
				},
				noDataMsg: I18n.t('No_files'),
				testID: 'room-files-view',
				renderItem: (item) => {
					const url = getFileUrlFromMessage(item);

					return (
						<Message
							{...renderItemCommonProps(item)}
							attachments={[{
								title: item.name,
								description: item.description,
								...url
							}]}
							theme={theme}
						/>
					);
				}
			},
			// Mentions Messages Screen
			Mentions: {
				name: I18n.t('Mentions'),
				fetchFunc: () => RocketChat.getMessages(
					this.rid,
					this.t,
					{ 'mentions._id': { $in: [user.id] } },
					messages.length
				),
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
				fetchFunc: () => RocketChat.getMessages(
					this.rid,
					this.t,
					{ 'starred._id': { $in: [user.id] } },
					messages.length
				),
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
				actionTitle: I18n.t('Unstar'),
				handleActionPress: message => RocketChat.toggleStarMessage(message._id, message.starred)
			},
			// Pinned Messages Screen
			Pinned: {
				name: I18n.t('Pinned'),
				fetchFunc: () => RocketChat.getMessages(this.rid, this.t, { pinned: true }, messages.length),
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
				actionTitle: I18n.t('Unpin'),
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
		const { navigation, split } = this.props;
		let params = { attachment };
		if (split) {
			params = { ...params, from: 'MessagesView' };
		}
		navigation.navigate('AttachmentView', params);
	}

	onLongPress = (message) => {
		this.setState({ message });
		this.showActionSheet();
	}

	showActionSheet = () => {
		ActionSheet.showActionSheetWithOptions({
			options: [this.content.actionTitle, I18n.t('Cancel')],
			cancelButtonIndex: CANCEL_INDEX,
			title: I18n.t('Actions')
		}, (actionIndex) => {
			this.handleActionPress(actionIndex);
		});
	}

	handleActionPress = async(actionIndex) => {
		if (actionIndex === ACTION_INDEX) {
			const { message } = this.state;

			try {
				const result = await this.content.handleActionPress(message);
				if (result.success) {
					this.setState(prevState => ({
						messages: prevState.messages.filter(item => item._id !== message._id),
						total: prevState.total - 1
					}));
				}
			} catch (error) {
				console.warn('MessagesView -> handleActionPress -> catch -> error', error);
			}
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
				style={[
					styles.list,
					{ backgroundColor: themes[theme].backgroundColor }
				]}
				forceInset={{ vertical: 'never' }}
				testID={this.content.testID}
			>
				<StatusBar theme={theme} />
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
	customEmojis: state.customEmojis
});

export default connect(mapStateToProps)(withSplit(withTheme(MessagesView)));
