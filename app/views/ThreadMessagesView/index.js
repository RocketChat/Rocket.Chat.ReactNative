import React from 'react';
import PropTypes from 'prop-types';
import {
	FlatList, View, Text, InteractionManager
} from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
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
const API_FETCH_COUNT = 50;

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
		this.rooms = database.objects('subscriptions').filtered('rid = $0', this.rid);
		this.messages = database.objects('threads').filtered('rid = $0', this.rid).sorted('ts', true);
		safeAddListener(this.messages, this.updateMessages);
		this.state = {
			loading: false,
			end: false,
			messages: this.messages
		};
		this.mounted = false;
	}

	componentDidMount() {
		this.mountInteraction = InteractionManager.runAfterInteractions(() => {
			this.init();
			this.mounted = true;
		});
	}

	componentWillUnmount() {
		this.messages.removeAllListeners();
		if (this.mountInteraction && this.mountInteraction.cancel) {
			this.mountInteraction.cancel();
		}
		if (this.loadInteraction && this.loadInteraction.cancel) {
			this.loadInteraction.cancel();
		}
		if (this.syncInteraction && this.syncInteraction.cancel) {
			this.syncInteraction.cancel();
		}
	}

	// eslint-disable-next-line react/sort-comp
	updateMessages = debounce(() => {
		this.setState({ messages: this.messages });
	}, 300)

	init = () => {
		const [room] = this.rooms;
		const lastThreadSync = new Date();
		if (room.lastThreadSync) {
			this.sync(room.lastThreadSync);
		} else {
			this.load();
		}
		database.write(() => {
			room.lastThreadSync = lastThreadSync;
		});
	}

	// eslint-disable-next-line react/sort-comp
	load = debounce(async() => {
		const { loading, end } = this.state;
		if (end || loading || !this.mounted) {
			return;
		}

		this.setState({ loading: true });

		try {
			const result = await RocketChat.getThreadsList({
				rid: this.rid, count: API_FETCH_COUNT, offset: this.messages.length
			});
			if (result.success) {
				this.loadInteraction = InteractionManager.runAfterInteractions(() => {
					database.write(() => result.threads.forEach((message) => {
						try {
							database.create('threads', buildMessage(message), true);
						} catch (e) {
							log('ThreadMessagesView -> load -> create', e);
						}
					}));

					this.setState({
						loading: false,
						end: result.count < API_FETCH_COUNT
					});
				});
			}
		} catch (error) {
			console.log('ThreadMessagesView -> load -> error', error);
			this.setState({ loading: false, end: true });
		}
	}, 300)

	// eslint-disable-next-line react/sort-comp
	sync = async(updatedSince) => {
		this.setState({ loading: true });

		try {
			const result = await RocketChat.getSyncThreadsList({
				rid: this.rid, updatedSince: updatedSince.toISOString()
			});
			if (result.success && result.threads) {
				this.syncInteraction = InteractionManager.runAfterInteractions(() => {
					const { update, remove } = result.threads;
					database.write(() => {
						if (update && update.length) {
							update.forEach((message) => {
								try {
									database.create('threads', buildMessage(message), true);
								} catch (e) {
									log('ThreadMessagesView -> sync -> update', e);
								}
							});
						}

						if (remove && remove.length) {
							remove.forEach((message) => {
								const oldMessage = database.objectForPrimaryKey('threads', message._id);
								if (oldMessage) {
									try {
										database.delete(oldMessage);
									} catch (e) {
										log('ThreadMessagesView -> sync -> delete', e);
									}
								}
							});
						}
					});

					this.setState({
						loading: false
					});
				});
			}
		} catch (error) {
			console.log('ThreadMessagesView -> sync -> error', error);
			this.setState({ loading: false });
		}
	}

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
		if (item.isValid && item.isValid()) {
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
		return null;
	}

	render() {
		const { loading, messages } = this.state;

		if (!loading && this.messages.length === 0) {
			return this.renderEmpty();
		}

		return (
			<SafeAreaView style={styles.list} testID='thread-messages-view' forceInset={{ bottom: 'never' }}>
				<StatusBar />
				<FlatList
					data={messages}
					extraData={this.state}
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
