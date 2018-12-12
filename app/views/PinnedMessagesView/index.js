import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, View, Text } from 'react-native';
import { connect } from 'react-redux';
import ActionSheet from 'react-native-actionsheet';
import SafeAreaView from 'react-native-safe-area-view';
import equal from 'deep-equal';

import LoggedView from '../View';
import styles from './styles';
import Message from '../../containers/message/Message';
import RCActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';
import { DEFAULT_HEADER } from '../../constants/headerOptions';
import RocketChat from '../../lib/rocketchat';
import database from '../../lib/realm';

const PIN_INDEX = 0;
const CANCEL_INDEX = 1;
const options = [I18n.t('Unpin'), I18n.t('Cancel')];

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
export default class PinnedMessagesView extends LoggedView {
	static options() {
		return {
			...DEFAULT_HEADER,
			topBar: {
				...DEFAULT_HEADER.topBar,
				title: {
					...DEFAULT_HEADER.topBar.title,
					text: I18n.t('Pinned')
				}
			}
		};
	}

	static propTypes = {
		rid: PropTypes.string,
		user: PropTypes.object,
		baseUrl: PropTypes.string,
		customEmojis: PropTypes.object
	}

	constructor(props) {
		super('PinnedMessagesView', props);
		this.rooms = database.objects('subscriptions').filtered('rid = $0', props.rid);
		this.state = {
			loading: false,
			room: this.rooms[0],
			messages: []
		};
	}

	componentDidMount() {
		this.load();
	}

	shouldComponentUpdate(nextProps, nextState) {
		return !equal(this.state, nextState);
	}

	onLongPress = (message) => {
		this.setState({ message });
		if (this.actionSheet && this.actionSheet.show) {
			this.actionSheet.show();
		}
	}

	handleActionPress = (actionIndex) => {
		switch (actionIndex) {
			case PIN_INDEX:
				this.unPin();
				break;
			default:
				break;
		}
	}

	unPin = async() => {
		const { message } = this.state;
		try {
			const result = await RocketChat.togglePinMessage(message);
			if (result.success) {
				this.setState(prevState => ({
					messages: prevState.messages.filter(item => item._id !== message._id)
				}));
			}
		} catch (error) {
			console.log('PinnedMessagesView -> unPin -> catch -> error', error);
		}
	}

	load = async() => {
		const {
			messages, total, loading, room
		} = this.state;
		if (messages.length === total || loading) {
			return;
		}

		this.setState({ loading: true });

		try {
			const result = await RocketChat.getMessages(room.rid, room.t, { pinned: true }, messages.length);
			if (result.success) {
				this.setState(prevState => ({
					messages: [...prevState.messages, ...result.messages],
					total: result.total,
					loading: false
				}));
			}
		} catch (error) {
			this.setState({ loading: false });
			console.log('PinnedMessagesView -> catch -> error', error);
		}
	}

	renderEmpty = () => (
		<View style={styles.listEmptyContainer} testID='pinned-messages-view'>
			<Text>{I18n.t('No_pinned_messages')}</Text>
		</View>
	)

	renderItem = ({ item }) => {
		const { user, customEmojis, baseUrl } = this.props;
		return (
			<Message
				style={styles.message}
				customEmojis={customEmojis}
				baseUrl={baseUrl}
				user={user}
				author={item.u}
				ts={item.ts}
				msg={item.msg}
				attachments={item.attachments || []}
				timeFormat='MMM Do YYYY, h:mm:ss a'
				header
				edited={!!item.editedAt}
				onLongPress={() => this.onLongPress(item)}
			/>
		);
	}

	render() {
		const { messages, loading } = this.state;

		if (!loading && messages.length === 0) {
			return this.renderEmpty();
		}

		return (
			<SafeAreaView style={styles.list} testID='pinned-messages-view' forceInset={{ bottom: 'never' }}>
				<FlatList
					data={messages}
					renderItem={this.renderItem}
					style={styles.list}
					keyExtractor={item => item._id}
					onEndReached={this.load}
					ListFooterComponent={loading ? <RCActivityIndicator /> : null}
				/>
				<ActionSheet
					ref={o => this.actionSheet = o}
					title={I18n.t('Actions')}
					options={options}
					cancelButtonIndex={CANCEL_INDEX}
					onPress={this.handleActionPress}
				/>
			</SafeAreaView>
		);
	}
}
