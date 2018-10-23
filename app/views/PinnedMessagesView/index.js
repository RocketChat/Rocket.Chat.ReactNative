import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, View, Text } from 'react-native';
import { connect } from 'react-redux';
import ActionSheet from 'react-native-actionsheet';
import SafeAreaView from 'react-native-safe-area-view';

import { openPinnedMessages as openPinnedMessagesAction, closePinnedMessages as closePinnedMessagesAction } from '../../actions/pinnedMessages';
import { togglePinRequest as togglePinRequestAction } from '../../actions/messages';
import LoggedView from '../View';
import styles from './styles';
import Message from '../../containers/message';
import RCActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';

const PIN_INDEX = 0;
const CANCEL_INDEX = 1;
const options = [I18n.t('Unpin'), I18n.t('Cancel')];

@connect(state => ({
	messages: state.pinnedMessages.messages,
	ready: state.pinnedMessages.ready,
	user: {
		id: state.login.user && state.login.user.id,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	}
}), dispatch => ({
	openPinnedMessages: (rid, limit) => dispatch(openPinnedMessagesAction(rid, limit)),
	closePinnedMessages: () => dispatch(closePinnedMessagesAction()),
	togglePinRequest: message => dispatch(togglePinRequestAction(message))
}))
/** @extends React.Component */
export default class PinnedMessagesView extends LoggedView {
	static options() {
		return {
			topBar: {
				title: {
					text: I18n.t('Pinned')
				}
			}
		};
	}

	static propTypes = {
		rid: PropTypes.string,
		messages: PropTypes.array,
		ready: PropTypes.bool,
		user: PropTypes.object,
		openPinnedMessages: PropTypes.func,
		closePinnedMessages: PropTypes.func,
		togglePinRequest: PropTypes.func
	}

	constructor(props) {
		super('PinnedMessagesView', props);
		this.state = {
			message: {},
			loading: true,
			loadingMore: false
		};
	}

	componentDidMount() {
		this.limit = 20;
		this.load();
	}

	componentWillReceiveProps(nextProps) {
		const { ready } = this.props;
		if (nextProps.ready && nextProps.ready !== ready) {
			this.setState({ loading: false, loadingMore: false });
		}
	}

	componentWillUnmount() {
		const { closePinnedMessages } = this.props;
		closePinnedMessages();
	}

	onLongPress = (message) => {
		this.setState({ message });
		if (this.actionSheet && this.actionSheet.show) {
			this.actionSheet.show();
		}
	}

	handleActionPress = (actionIndex) => {
		const { message } = this.state;
		const { togglePinRequest } = this.props;

		switch (actionIndex) {
			case PIN_INDEX:
				togglePinRequest(message);
				break;
			default:
				break;
		}
	}

	load = () => {
		const { openPinnedMessages, rid } = this.props;
		openPinnedMessages(rid, this.limit);
	}

	moreData = () => {
		const { loadingMore } = this.state;
		const { messages } = this.props;
		if (messages.length < this.limit) {
			return;
		}
		if (!loadingMore) {
			this.setState({ loadingMore: true });
			this.limit += 20;
			this.load();
		}
	}

	renderEmpty = () => (
		<View style={styles.listEmptyContainer} testID='pinned-messages-view'>
			<Text>{I18n.t('No_pinned_messages')}</Text>
		</View>
	)

	renderItem = ({ item }) => {
		const { user } = this.props;
		return (
			<Message
				item={item}
				style={styles.message}
				reactions={item.reactions}
				user={user}
				customTimeFormat='MMMM Do YYYY, h:mm:ss a'
				onLongPress={this.onLongPress}
			/>
		);
	}

	render() {
		const { loading, loadingMore } = this.state;
		const { messages, ready } = this.props;

		if (ready && messages.length === 0) {
			return this.renderEmpty();
		}

		return (
			<SafeAreaView style={styles.list} testID='pinned-messages-view' forceInset={{ bottom: 'never' }}>
				<FlatList
					data={messages}
					renderItem={this.renderItem}
					style={styles.list}
					keyExtractor={item => item._id}
					onEndReached={this.moreData}
					ListHeaderComponent={loading ? <RCActivityIndicator /> : null}
					ListFooterComponent={loadingMore ? <RCActivityIndicator /> : null}
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
