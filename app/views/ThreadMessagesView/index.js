import React from 'react';
import PropTypes from 'prop-types';
import {
	FlatList, View, Text, InteractionManager
} from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import moment from 'moment';
import orderBy from 'lodash/orderBy';
import { Q } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import styles from './styles';
import Message from '../../containers/message';
import ActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';
import RocketChat from '../../lib/rocketchat';
import database from '../../lib/database';
import StatusBar from '../../containers/StatusBar';
import buildMessage from '../../lib/methods/helpers/buildMessage';
import log from '../../utils/log';
import debounce from '../../utils/debounce';
import protectedFunction from '../../lib/methods/helpers/protectedFunction';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { themedHeader } from '../../utils/navigation';
import ModalNavigation from '../../lib/ModalNavigation';
import { getUserSelector } from '../../selectors/login';

const Separator = React.memo(({ theme }) => <View style={[styles.separator, { backgroundColor: themes[theme].separatorColor }]} />);
Separator.propTypes = {
	theme: PropTypes.string
};

const API_FETCH_COUNT = 50;

class ThreadMessagesView extends React.Component {
	static navigationOptions = ({ screenProps }) => ({
		...themedHeader(screenProps.theme),
		title: I18n.t('Threads')
	});

	static propTypes = {
		user: PropTypes.object,
		navigation: PropTypes.object,
		baseUrl: PropTypes.string,
		useRealName: PropTypes.bool,
		theme: PropTypes.string,
		customEmojis: PropTypes.object,
		screenProps: PropTypes.object
	}

	constructor(props) {
		super(props);
		this.mounted = false;
		this.rid = props.navigation.getParam('rid');
		this.t = props.navigation.getParam('t');
		this.state = {
			loading: false,
			end: false,
			messages: []
		};
		this.subscribeData();
	}

	componentDidMount() {
		this.mounted = true;
		this.mountInteraction = InteractionManager.runAfterInteractions(() => {
			this.init();
		});
	}

	componentWillUnmount() {
		console.countReset(`${ this.constructor.name }.render calls`);
		if (this.mountInteraction && this.mountInteraction.cancel) {
			this.mountInteraction.cancel();
		}
		if (this.syncInteraction && this.syncInteraction.cancel) {
			this.syncInteraction.cancel();
		}
		if (this.subSubscription && this.subSubscription.unsubscribe) {
			this.subSubscription.unsubscribe();
		}
		if (this.messagesSubscription && this.messagesSubscription.unsubscribe) {
			this.messagesSubscription.unsubscribe();
		}
	}

	// eslint-disable-next-line react/sort-comp
	subscribeData = async() => {
		try {
			const db = database.active;
			const subscription = await db.collections
				.get('subscriptions')
				.find(this.rid);
			const observable = subscription.observe();
			this.subSubscription = observable
				.subscribe((data) => {
					this.subscription = data;
				});
			this.messagesObservable = db.collections
				.get('threads')
				.query(
					Q.where('rid', this.rid),
					Q.where('t', Q.notEq('rm'))
				)
				.observeWithColumns(['updated_at']);
			this.messagesSubscription = this.messagesObservable
				.subscribe((data) => {
					const messages = orderBy(data, ['ts'], ['desc']);
					if (this.mounted) {
						this.setState({ messages });
					} else {
						this.state.messages = messages;
					}
				});
		} catch (e) {
			// Do nothing
		}
	}

	// eslint-disable-next-line react/sort-comp
	init = () => {
		if (!this.subscription) {
			this.load();
		}
		try {
			const lastThreadSync = new Date();
			if (this.subscription.lastThreadSync) {
				this.sync(this.subscription.lastThreadSync);
			} else {
				this.load(lastThreadSync);
			}
		} catch (e) {
			log(e);
		}
	}

	updateThreads = async({ update, remove, lastThreadSync }) => {
		// if there's no subscription, manage data on this.state.messages
		// note: sync will never be called without subscription
		if (!this.subscription) {
			this.setState(({ messages }) => ({ messages: [...messages, ...update] }));
			return;
		}

		try {
			const db = database.active;
			const threadsCollection = db.collections.get('threads');
			const allThreadsRecords = await this.subscription.threads.fetch();
			let threadsToCreate = [];
			let threadsToUpdate = [];
			let threadsToDelete = [];

			if (update && update.length) {
				update = update.map(m => buildMessage(m));
				// filter threads
				threadsToCreate = update.filter(i1 => !allThreadsRecords.find(i2 => i1._id === i2.id));
				threadsToUpdate = allThreadsRecords.filter(i1 => update.find(i2 => i1.id === i2._id));
				threadsToCreate = threadsToCreate.map(thread => threadsCollection.prepareCreate(protectedFunction((t) => {
					t._raw = sanitizedRaw({ id: thread._id }, threadsCollection.schema);
					t.subscription.set(this.subscription);
					Object.assign(t, thread);
				})));
				threadsToUpdate = threadsToUpdate.map((thread) => {
					const newThread = update.find(t => t._id === thread.id);
					return thread.prepareUpdate(protectedFunction((t) => {
						Object.assign(t, newThread);
					}));
				});
			}

			if (remove && remove.length) {
				threadsToDelete = allThreadsRecords.filter(i1 => remove.find(i2 => i1.id === i2._id));
				threadsToDelete = threadsToDelete.map(t => t.prepareDestroyPermanently());
			}

			await db.action(async() => {
				await db.batch(
					...threadsToCreate,
					...threadsToUpdate,
					...threadsToDelete,
					this.subscription.prepareUpdate((s) => {
						s.lastThreadSync = lastThreadSync;
					})
				);
			});
		} catch (e) {
			log(e);
		}
	}

	// eslint-disable-next-line react/sort-comp
	load = debounce(async(lastThreadSync) => {
		const { loading, end, messages } = this.state;
		if (end || loading || !this.mounted) {
			return;
		}

		this.setState({ loading: true });

		try {
			const result = await RocketChat.getThreadsList({
				rid: this.rid, count: API_FETCH_COUNT, offset: messages.length
			});
			if (result.success) {
				this.updateThreads({ update: result.threads, lastThreadSync });
				this.setState({
					loading: false,
					end: result.count < API_FETCH_COUNT
				});
			}
		} catch (e) {
			log(e);
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
					this.updateThreads({ update, remove, lastThreadSync: updatedSince });
				});
			}
			this.setState({
				loading: false
			});
		} catch (e) {
			log(e);
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

	getCustomEmoji = (name) => {
		const { customEmojis } = this.props;
		const emoji = customEmojis[name];
		if (emoji) {
			return emoji;
		}
		return null;
	}

	showAttachment = (attachment) => {
		const { navigation } = this.props;
		navigation.navigate('AttachmentView', { attachment });
	}

	onThreadPress = debounce((item) => {
		const { navigation } = this.props;
		navigation.push('RoomView', {
			rid: item.subscription.id, tmid: item.id, name: item.msg, t: 'thread'
		});
	}, 1000, true)

	renderSeparator = () => {
		const { theme } = this.props;
		return <Separator theme={theme} />;
	}

	renderEmpty = () => {
		const { theme } = this.props;
		return (
			<View style={[styles.listEmptyContainer, { backgroundColor: themes[theme].backgroundColor }]} testID='thread-messages-view'>
				<Text style={[styles.noDataFound, { color: themes[theme].titleText }]}>{I18n.t('No_thread_messages')}</Text>
			</View>
		);
	}

	navToRoomInfo = (navParam) => {
		const { navigation, user, screenProps } = this.props;
		if (navParam.rid === user.id) {
			return;
		}
		if (screenProps && screenProps.split) {
			navigation.navigate('RoomActionsView', { rid: this.rid, t: this.t });
			ModalNavigation.navigate('RoomInfoView', navParam);
		} else {
			navigation.navigate('RoomInfoView', navParam);
		}
	}

	renderItem = ({ item }) => {
		const {
			user, navigation, baseUrl, useRealName
		} = this.props;
		return (
			<Message
				key={item.id}
				item={item}
				user={user}
				archived={false}
				broadcast={false}
				status={item.status}
				navigation={navigation}
				timeFormat='MMM D'
				customThreadTimeFormat='MMM Do YYYY, h:mm:ss a'
				onThreadPress={this.onThreadPress}
				baseUrl={baseUrl}
				useRealName={useRealName}
				getCustomEmoji={this.getCustomEmoji}
				navToRoomInfo={this.navToRoomInfo}
				showAttachment={this.showAttachment}
			/>
		);
	}

	render() {
		console.count(`${ this.constructor.name }.render calls`);
		const { loading, messages } = this.state;
		const { theme } = this.props;

		if (!loading && messages.length === 0) {
			return this.renderEmpty();
		}

		return (
			<SafeAreaView style={styles.list} testID='thread-messages-view' forceInset={{ vertical: 'never' }}>
				<StatusBar theme={theme} />
				<FlatList
					data={messages}
					extraData={this.state}
					renderItem={this.renderItem}
					style={[styles.list, { backgroundColor: themes[theme].backgroundColor }]}
					contentContainerStyle={styles.contentContainer}
					keyExtractor={item => item._id}
					onEndReached={this.load}
					onEndReachedThreshold={0.5}
					maxToRenderPerBatch={5}
					initialNumToRender={1}
					ItemSeparatorComponent={this.renderSeparator}
					ListFooterComponent={loading ? <ActivityIndicator theme={theme} /> : null}
				/>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.server.server,
	user: getUserSelector(state),
	useRealName: state.settings.UI_Use_Real_Name,
	customEmojis: state.customEmojis
});

export default connect(mapStateToProps)(withTheme(ThreadMessagesView));
