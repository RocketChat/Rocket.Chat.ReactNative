import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, View, Text } from 'react-native';
import { connect } from 'react-redux';
import SafeAreaView from 'react-native-safe-area-view';
import equal from 'deep-equal';

import { openSnippetedMessages as openSnippetedMessagesAction, closeSnippetedMessages as closeSnippetedMessagesAction } from '../../actions/snippetedMessages';
import LoggedView from '../View';
import styles from './styles';
import Message from '../../containers/message';
import RCActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';
import { DEFAULT_HEADER } from '../../constants/headerOptions';

@connect(state => ({
	messages: state.snippetedMessages.messages,
	ready: state.snippetedMessages.ready,
	user: {
		id: state.login.user && state.login.user.id,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	}
}), dispatch => ({
	openSnippetedMessages: (rid, limit) => dispatch(openSnippetedMessagesAction(rid, limit)),
	closeSnippetedMessages: () => dispatch(closeSnippetedMessagesAction())
}))
/** @extends React.Component */
export default class SnippetedMessagesView extends LoggedView {
	static options() {
		return {
			...DEFAULT_HEADER,
			topBar: {
				...DEFAULT_HEADER.topBar,
				title: {
					...DEFAULT_HEADER.topBar.title,
					text: I18n.t('Snippets')
				}
			}
		};
	}

	static propTypes = {
		rid: PropTypes.string,
		messages: PropTypes.array,
		ready: PropTypes.bool,
		user: PropTypes.object,
		openSnippetedMessages: PropTypes.func,
		closeSnippetedMessages: PropTypes.func
	}

	constructor(props) {
		super('SnippetedMessagesView', props);
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
		const { ready } = this.props;
		if (nextProps.ready && nextProps.ready !== ready) {
			this.setState({ loading: false, loadingMore: false });
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { loading, loadingMore } = this.state;
		const { messages, ready } = this.props;
		if (nextState.loading !== loading) {
			return true;
		}
		if (nextState.loadingMore !== loadingMore) {
			return true;
		}
		if (nextProps.ready !== ready) {
			return true;
		}
		if (!equal(nextState.messages, messages)) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		const { closeSnippetedMessages } = this.props;
		closeSnippetedMessages();
	}

	load = () => {
		const { rid, openSnippetedMessages } = this.props;
		openSnippetedMessages(rid, this.limit);
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
		<View style={styles.listEmptyContainer} testID='snippeted-messages-view'>
			<Text>{I18n.t('No_snippeted_messages')}</Text>
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
				customTimeFormat='MMM Do YYYY, h:mm:ss a'
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
			<SafeAreaView style={styles.list} testID='snippeted-messages-view' forceInset={{ bottom: 'never' }}>
				<FlatList
					data={messages}
					renderItem={this.renderItem}
					style={styles.list}
					keyExtractor={item => item._id}
					onEndReached={this.moreData}
					ListHeaderComponent={loading ? <RCActivityIndicator /> : null}
					ListFooterComponent={loadingMore ? <RCActivityIndicator /> : null}
				/>
			</SafeAreaView>
		);
	}
}
