import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, View, Text } from 'react-native';
import { connect } from 'react-redux';

import LoggedView from '../View';
import { openMentionedMessages, closeMentionedMessages } from '../../actions/mentionedMessages';
import styles from './styles';
import Message from '../../containers/message';
import RCActivityIndicator from '../../containers/ActivityIndicator';

@connect(
	state => ({
		messages: state.mentionedMessages.messages,
		ready: state.mentionedMessages.ready,
		user: state.login.user,
		baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
	}),
	dispatch => ({
		openMentionedMessages: (rid, limit) => dispatch(openMentionedMessages(rid, limit)),
		closeMentionedMessages: () => dispatch(closeMentionedMessages())
	})
)
export default class MentionedMessagesView extends LoggedView {
	static propTypes = {
		navigation: PropTypes.object,
		messages: PropTypes.array,
		ready: PropTypes.bool,
		user: PropTypes.object,
		baseUrl: PropTypes.string,
		openMentionedMessages: PropTypes.func,
		closeMentionedMessages: PropTypes.func
	}

	constructor(props) {
		super('MentionedMessagesView', props);
		this.state = {
			loading: true,
			loadingMore: false
		};
	}

	componentDidMount() {
		this.limit = 20;
		this.load();
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.ready && nextProps.ready !== this.props.ready) {
			this.setState({ loading: false, loadingMore: false });
		}
	}

	componentWillUnmount() {
		this.props.closeMentionedMessages();
	}

	load = () => {
		this.props.openMentionedMessages(this.props.navigation.state.params.rid, this.limit);
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
		<View style={styles.listEmptyContainer}>
			<Text>No mentioned messages</Text>
		</View>
	)

	renderItem = ({ item }) => (
		<Message
			item={item}
			style={styles.message}
			reactions={item.reactions}
			user={this.props.user}
			baseUrl={this.props.baseUrl}
			customTimeFormat='MMMM Do YYYY, h:mm:ss a'
			onLongPress={() => {}}
		/>
	)

	render() {
		const { loading, loadingMore } = this.state;
		const { messages, ready } = this.props;

		if (ready && messages.length === 0) {
			return this.renderEmpty();
		}

		return (
			<FlatList
				key='mentioned-messages-view-list'
				data={messages}
				renderItem={this.renderItem}
				style={styles.list}
				keyExtractor={item => item._id}
				onEndReached={this.moreData}
				ListHeaderComponent={loading && <RCActivityIndicator />}
				ListFooterComponent={loadingMore && <RCActivityIndicator />}
			/>
		);
	}
}
