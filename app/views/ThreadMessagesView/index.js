import React from 'react';
import PropTypes from 'prop-types';
import {
	FlatList, View, Text, InteractionManager
} from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';
import EJSON from 'ejson';
import moment from 'moment';

import LoggedView from '../View';
import styles from './styles';
import Message from '../../containers/message';
import RCActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';
import RocketChat from '../../lib/rocketchat';
import database, { safeAddListener } from '../../lib/realm';
import StatusBar from '../../containers/StatusBar';
import buildMessage from '../../lib/methods/helpers/buildMessage';
import log from '../../utils/log';
import debounce from '../../utils/debounce';

const Separator = React.memo(() => <View style={styles.separator} />);

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
export default class ThreadMessagesView extends LoggedView {
	static navigationOptions = {
		title: I18n.t('Threads')
	}

	static propTypes = {
		user: PropTypes.object,
		navigation: PropTypes.object
	}

	constructor(props) {
		super('ThreadMessagesView', props);
		this.rid = props.navigation.getParam('rid');
		this.t = props.navigation.getParam('t');
		this.messages = database.objects('threads').filtered('rid = $0', this.rid);
		safeAddListener(this.messages, this.updateMessages);
		this.state = {
			loading: false,
			messages: this.messages.slice(),
			end: false,
			total: 0
		};
	}

	componentDidMount() {
		this.load();
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { loading, messages, end } = this.state;
		if (nextState.loading !== loading) {
			return true;
		}
		if (!equal(nextState.messages, messages)) {
			return true;
		}
		if (!equal(nextState.end, end)) {
			return true;
		}
		return false;
	}

	updateMessages = () => {
		this.setState({ messages: this.messages.slice() });
	}

	// eslint-disable-next-line react/sort-comp
	load = debounce(async() => {
		const {
			loading, end, total
		} = this.state;
		if (end || loading) {
			return;
		}

		this.setState({ loading: true });

		try {
			const result = await RocketChat.getThreadsList({ rid: this.rid, limit: 50, skip: total });

			database.write(() => result.forEach((message) => {
				try {
					database.create('threads', buildMessage(EJSON.fromJSONValue(message)), true);
				} catch (e) {
					log('ThreadMessagesView -> load -> create', e);
				}
			}));

			InteractionManager.runAfterInteractions(() => {
				this.setState(prevState => ({
					loading: false,
					end: result.length < 50,
					total: prevState.total + result.length
				}));
			});
		} catch (error) {
			console.log('ThreadMessagesView -> catch -> error', error);
			this.setState({ loading: false, end: true });
		}
	}, 300, true)

	formatMessage = lm => (
		lm ? moment(lm).calendar(null, {
			lastDay: `[${ I18n.t('Yesterday') }]`,
			sameDay: 'h:mm A',
			lastWeek: 'dddd',
			sameElse: 'MMM D'
		}) : null
	)

	renderSeparator = () => <Separator />

	renderEmpty = () => (
		<View style={styles.listEmptyContainer} testID='thread-messages-view'>
			<Text style={styles.noDataFound}>{I18n.t('No_thread_messages')}</Text>
		</View>
	)

	renderItem = ({ item }) => {
		const { user, navigation } = this.props;
		return (
			<Message
				key={item._id}
				item={item}
				user={user}
				archived={false}
				broadcast={false}
				status={item.status}
				_updatedAt={item._updatedAt}
				navigation={navigation}
				customTimeFormat='MMM D'
				customThreadTimeFormat='MMM Do YYYY, h:mm:ss a'
				fetchThreadName={this.fetchThreadName}
				onDiscussionPress={this.onDiscussionPress}
			/>
		);
	}

	render() {
		const { messages, loading } = this.state;

		if (!loading && messages.length === 0) {
			return this.renderEmpty();
		}

		return (
			<SafeAreaView style={styles.list} testID='thread-messages-view' forceInset={{ bottom: 'never' }}>
				<StatusBar />
				<FlatList
					data={messages}
					renderItem={this.renderItem}
					style={styles.list}
					contentContainerStyle={styles.contentContainer}
					keyExtractor={item => item._id}
					onEndReached={this.load}
					onEndReachedThreshold={0.5}
					maxToRenderPerBatch={5}
					initialNumToRender={1}
					ItemSeparatorComponent={this.renderSeparator}
					ListFooterComponent={loading ? <RCActivityIndicator /> : null}
				/>
			</SafeAreaView>
		);
	}
}
