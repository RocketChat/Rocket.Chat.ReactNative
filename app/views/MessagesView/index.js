import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, View, Text } from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';
import ActionSheet from 'react-native-action-sheet';

import LoggedView from '../View';
import styles from './styles';
import Message from '../../containers/message/Message';
import RCActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';
import RocketChat from '../../lib/rocketchat';
import StatusBar from '../../containers/StatusBar';
import getFileUrlFromMessage from '../../lib/methods/helpers/getFileUrlFromMessage';

const ACTION_INDEX = 0;
const CANCEL_INDEX = 1;

@connect(state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	customEmojis: state.customEmojis,
	user: {
		id: state.login.user && state.login.user.id,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	}
}))
/** @extends React.Component */
export default class MessagesView extends LoggedView {
	static navigationOptions = ({ navigation }) => ({
		title: navigation.state.params.name
	});

	static propTypes = {
		user: PropTypes.object,
		baseUrl: PropTypes.string,
		customEmojis: PropTypes.object,
		navigation: PropTypes.object
	}

	constructor(props) {
		super('MessagesView', props);
		this.state = {
			loading: false,
			messages: []
		};
		this.rid = props.navigation.getParam('rid');
		this.t = props.navigation.getParam('t');
		this.content = this.defineMessagesViewContent(props.navigation.getParam('name'));
	}

	componentDidMount() {
		this.load();
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { loading, messages } = this.state;
		if (nextState.loading !== loading) {
			return true;
		}
		if (!equal(nextState.messages, messages)) {
			return true;
		}
		return false;
	}

	defineMessagesViewContent = (name) => {
		const { messages } = this.state;
		const { user, baseUrl, customEmojis } = this.props;

		const renderItemCommonProps = item => ({
			customEmojis,
			baseUrl,
			user,
			author: item.u || item.user,
			ts: item.ts || item.uploadedAt,
			timeFormat: 'MMM Do YYYY, h:mm:ss a',
			edited: !!item.editedAt,
			header: true,
			attachments: item.attachments || []
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
					/>
				),
				actionTitle: I18n.t('Unstar'),
				handleActionPress: message => RocketChat.toggleStarMessage(message)
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
					/>
				),
				actionTitle: I18n.t('Unpin'),
				handleActionPress: message => RocketChat.togglePinMessage(message)
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

	renderEmpty = () => (
		<View style={styles.listEmptyContainer} testID={this.content.testID}>
			<Text style={styles.noDataFound}>{this.content.noDataMsg}</Text>
		</View>
	)

	renderItem = ({ item }) => this.content.renderItem(item)

	render() {
		const { messages, loading } = this.state;

		if (!loading && messages.length === 0) {
			return this.renderEmpty();
		}

		return (
			<SafeAreaView style={styles.list} testID={this.content.testID} forceInset={{ bottom: 'never' }}>
				<StatusBar />
				<FlatList
					data={messages}
					renderItem={this.renderItem}
					style={styles.list}
					keyExtractor={item => item._id}
					onEndReached={this.load}
					ListFooterComponent={loading ? <RCActivityIndicator /> : null}
				/>
			</SafeAreaView>
		);
	}
}
