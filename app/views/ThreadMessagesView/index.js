import React from 'react';
import PropTypes from 'prop-types';
import {
	FlatList, View, Text, InteractionManager
} from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import moment from 'moment';

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
	user: {
		id: state.login.user && state.login.user.id,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	},
	useRealName: state.settings.UI_Use_Real_Name
}))
export default class ThreadMessagesView extends React.Component {
	static navigationOptions = {
		title: I18n.t('Threads')
	}

	static propTypes = {
		user: PropTypes.object,
		navigation: PropTypes.object,
		baseUrl: PropTypes.string,
		useRealName: PropTypes.bool
	}

	constructor(props) {
		super(props);
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

	// eslint-disable-next-line react/sort-comp
	init = () => {
		const [room] = this.rooms;

		// if there's not room at this point, it's better to show nothing
		if (!room) {
			return;
		}

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
							log('err_thread_messages_create', e);
						}
					}));

					this.setState({
						loading: false,
						end: result.count < API_FETCH_COUNT
					});
				});
			}
		} catch (error) {
			log('err_thread_messages_load', error);
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
									log('err_thread_messages_update', e);
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
										log('err_thread_messages_delete', e);
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
			log('err_thread_messages_sync', error);
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

	onThreadPress = debounce((item) => {
		const { navigation } = this.props;
		if (item.tmid) {
			navigation.push('RoomView', {
				rid: item.rid, tmid: item.tmid, name: item.tmsg, t: 'thread'
			});
		} else if (item.tlm) {
			const title = item.msg || (item.attachments && item.attachments.length && item.attachments[0].title);
			navigation.push('RoomView', {
				rid: item.rid, tmid: item._id, name: title, t: 'thread'
			});
		}
	}, 1000, true)

	renderSeparator = () => <Separator />

	renderEmpty = () => (
		<View style={styles.listEmptyContainer} testID='thread-messages-view'>
			<Text style={styles.noDataFound}>{I18n.t('No_thread_messages')}</Text>
		</View>
	)

	renderItem = ({ item }) => {
		const {
			user, navigation, baseUrl, useRealName
		} = this.props;
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
					timeFormat='MMM D'
					customThreadTimeFormat='MMM Do YYYY, h:mm:ss a'
					onThreadPress={this.onThreadPress}
					baseUrl={baseUrl}
					useRealName={useRealName}
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
