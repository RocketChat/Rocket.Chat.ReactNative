import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, View, Text } from 'react-native';
import { connect } from 'react-redux';
import ActionSheet from 'react-native-actionsheet';
import SafeAreaView from 'react-native-safe-area-view';

import { openStarredMessages as openStarredMessagesAction, closeStarredMessages as closeStarredMessagesAction } from '../../actions/starredMessages';
import { toggleStarRequest as toggleStarRequestAction } from '../../actions/messages';
import LoggedView from '../View';
import styles from './styles';
import Message from '../../containers/message';
import RCActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';

const STAR_INDEX = 0;
const CANCEL_INDEX = 1;
const options = [I18n.t('Unstar'), I18n.t('Cancel')];

@connect(state => ({
	messages: state.starredMessages.messages,
	ready: state.starredMessages.ready,
	user: {
		id: state.login.user && state.login.user.id,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	}
}), dispatch => ({
	openStarredMessages: (rid, limit) => dispatch(openStarredMessagesAction(rid, limit)),
	closeStarredMessages: () => dispatch(closeStarredMessagesAction()),
	toggleStarRequest: message => dispatch(toggleStarRequestAction(message))
}))
/** @extends React.Component */
export default class StarredMessagesView extends LoggedView {
	static options() {
		return {
			topBar: {
				title: {
					text: I18n.t('Starred')
				}
			}
		};
	}

	static propTypes = {
		rid: PropTypes.string,
		messages: PropTypes.array,
		ready: PropTypes.bool,
		user: PropTypes.object,
		openStarredMessages: PropTypes.func,
		closeStarredMessages: PropTypes.func,
		toggleStarRequest: PropTypes.func
	}

	constructor(props) {
		super('StarredMessagesView', props);
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
		const { closeStarredMessages } = this.props;
		closeStarredMessages();
	}

	onLongPress = (message) => {
		this.setState({ message });
		if (this.actionSheet && this.actionSheet.show) {
			this.actionSheet.show();
		}
	}

	handleActionPress = (actionIndex) => {
		const { message } = this.state;
		const { toggleStarRequest } = this.props;

		switch (actionIndex) {
			case STAR_INDEX:
				toggleStarRequest(message);
				break;
			default:
				break;
		}
	}

	load = () => {
		const { rid, openStarredMessages } = this.props;
		openStarredMessages(rid, this.limit);
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
		<View style={styles.listEmptyContainer} testID='starred-messages-view'>
			<Text>{I18n.t('No_starred_messages')}</Text>
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
			<SafeAreaView style={styles.list} testID='starred-messages-view' forceInset={{ bottom: 'never' }}>
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
