import React from 'react';
import { RefreshControl } from 'react-native';
import PropTypes from 'prop-types';
import { Q } from '@nozbe/watermelondb';
import moment from 'moment';
import { dequal } from 'dequal';
import { Value, event } from 'react-native-reanimated';

import database from '../../../lib/database';
import RocketChat from '../../../lib/rocketchat';
import log from '../../../utils/log';
import EmptyRoom from '../EmptyRoom';
import { animateNextTransition } from '../../../utils/layoutAnimation';
import ActivityIndicator from '../../../containers/ActivityIndicator';
import { themes } from '../../../constants/colors';
import List from './List';
import NavBottomFAB from './NavBottomFAB';
import debounce from '../../../utils/debounce';

const QUERY_SIZE = 50;

const onScroll = ({ y }) => event(
	[
		{
			nativeEvent: {
				contentOffset: { y }
			}
		}
	],
	{ useNativeDriver: true }
);

class ListContainer extends React.Component {
	static propTypes = {
		renderRow: PropTypes.func,
		rid: PropTypes.string,
		tmid: PropTypes.string,
		theme: PropTypes.string,
		loading: PropTypes.bool,
		listRef: PropTypes.func,
		hideSystemMessages: PropTypes.array,
		tunread: PropTypes.array,
		ignored: PropTypes.array,
		navigation: PropTypes.object,
		showMessageInMainThread: PropTypes.bool
	};

	constructor(props) {
		super(props);
		console.time(`${ this.constructor.name } init`);
		console.time(`${ this.constructor.name } mount`);
		this.count = 0;
		this.mounted = false;
		this.animated = false;
		this.jumping = false;
		this.state = {
			messages: [],
			refreshing: false,
			highlightedMessage: null
		};
		this.y = new Value(0);
		this.onScroll = onScroll({ y: this.y });
		this.query();
		this.unsubscribeFocus = props.navigation.addListener('focus', () => {
			this.animated = true;
		});
		this.viewabilityConfig = {
			itemVisiblePercentThreshold: 10
		};
		console.timeEnd(`${ this.constructor.name } init`);
	}

	componentDidMount() {
		this.mounted = true;
		console.timeEnd(`${ this.constructor.name } mount`);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { refreshing, highlightedMessage } = this.state;
		const {
			hideSystemMessages, theme, tunread, ignored, loading
		} = this.props;
		if (theme !== nextProps.theme) {
			return true;
		}
		if (loading !== nextProps.loading) {
			return true;
		}
		if (highlightedMessage !== nextState.highlightedMessage) {
			return true;
		}
		if (refreshing !== nextState.refreshing) {
			return true;
		}
		if (!dequal(hideSystemMessages, nextProps.hideSystemMessages)) {
			return true;
		}
		if (!dequal(tunread, nextProps.tunread)) {
			return true;
		}
		if (!dequal(ignored, nextProps.ignored)) {
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps) {
		const { hideSystemMessages } = this.props;
		if (!dequal(hideSystemMessages, prevProps.hideSystemMessages)) {
			this.reload();
		}
	}

	componentWillUnmount() {
		this.unsubscribeMessages();
		if (this.onEndReached && this.onEndReached.stop) {
			this.onEndReached.stop();
		}
		if (this.unsubscribeFocus) {
			this.unsubscribeFocus();
		}
		this.clearHighlightedMessageTimeout();
		console.countReset(`${ this.constructor.name }.render calls`);
	}

	clearHighlightedMessageTimeout = () => {
		if (this.highlightedMessageTimeout) {
			clearTimeout(this.highlightedMessageTimeout);
			this.highlightedMessageTimeout = false;
		}
	}

	query = async() => {
		this.count += QUERY_SIZE;
		const { rid, tmid, showMessageInMainThread } = this.props;
		const db = database.active;

		// handle servers with version < 3.0.0
		let { hideSystemMessages = [] } = this.props;
		if (!Array.isArray(hideSystemMessages)) {
			hideSystemMessages = [];
		}

		if (tmid) {
			try {
				this.thread = await db.collections
					.get('threads')
					.find(tmid);
			} catch (e) {
				console.log(e);
			}
			this.messagesObservable = db.collections
				.get('thread_messages')
				.query(
					Q.where('rid', tmid),
					Q.experimentalSortBy('ts', Q.desc),
					Q.experimentalSkip(0),
					Q.experimentalTake(this.count)
				)
				.observe();
		} else if (rid) {
			const whereClause = [
				Q.where('rid', rid),
				Q.experimentalSortBy('ts', Q.desc),
				Q.experimentalSkip(0),
				Q.experimentalTake(this.count)
			];
			if (!showMessageInMainThread) {
				whereClause.push(
					Q.or(
						Q.where('tmid', null),
						Q.where('tshow', Q.eq(true))
					)
				);
			}
			this.messagesObservable = db.collections
				.get('messages')
				.query(...whereClause)
				.observe();
		}

		if (rid) {
			this.unsubscribeMessages();
			this.messagesSubscription = this.messagesObservable
				.subscribe((messages) => {
					if (tmid && this.thread) {
						messages = [...messages, this.thread];
					}
					messages = messages.filter(m => !m.t || !hideSystemMessages?.includes(m.t));

					if (this.mounted) {
						this.setState({ messages }, () => this.update());
					} else {
						this.state.messages = messages;
					}
					// TODO: move it away from here
					this.readThreads();
				});
		}
	}

	reload = () => {
		this.count = 0;
		this.query();
	}

	readThreads = debounce(async() => {
		const { tmid } = this.props;

		if (tmid) {
			try {
				await RocketChat.readThreads(tmid);
			} catch {
				// Do nothing
			}
		}
	}, 300)

	onEndReached = () => this.query()

	onRefresh = () => this.setState({ refreshing: true }, async() => {
		const { messages } = this.state;
		const { rid, tmid } = this.props;

		if (messages.length) {
			try {
				if (tmid) {
					await RocketChat.loadThreadMessages({ tmid, rid });
				} else {
					await RocketChat.loadMissedMessages({ rid, lastOpen: moment().subtract(7, 'days').toDate() });
				}
			} catch (e) {
				log(e);
			}
		}

		this.setState({ refreshing: false });
	})

	update = () => {
		if (this.animated) {
			animateNextTransition();
		}
		this.forceUpdate();
	};

	unsubscribeMessages = () => {
		if (this.messagesSubscription && this.messagesSubscription.unsubscribe) {
			this.messagesSubscription.unsubscribe();
		}
	}

	getLastMessage = () => {
		const { messages } = this.state;
		if (messages.length > 0) {
			return messages[0];
		}
		return null;
	}

	handleScrollToIndexFailed = (params) => {
		const { listRef } = this.props;
		listRef.current.getNode().scrollToIndex({ index: params.highestMeasuredFrameIndex, animated: false });
	}

	jumpToMessage = messageId => new Promise(async(resolve) => {
		this.jumping = true;
		const { messages } = this.state;
		const { listRef } = this.props;
		const index = messages.findIndex(item => item.id === messageId);
		if (index > -1) {
			listRef.current.getNode().scrollToIndex({ index, viewPosition: 0.5 });
			await new Promise(res => setTimeout(res, 300));
			if (!this.viewableItems.map(vi => vi.key).includes(messageId)) {
				if (!this.jumping) {
					return resolve();
				}
				await setTimeout(() => resolve(this.jumpToMessage(messageId)), 300);
				return;
			}
			this.setState({ highlightedMessage: messageId });
			this.clearHighlightedMessageTimeout();
			this.highlightedMessageTimeout = setTimeout(() => {
				this.setState({ highlightedMessage: null });
			}, 10000);
			await setTimeout(() => resolve(), 300);
		} else {
			listRef.current.getNode().scrollToIndex({ index: messages.length - 1, animated: false });
			if (!this.jumping) {
				return resolve();
			}
			await setTimeout(() => resolve(this.jumpToMessage(messageId)), 300);
		}
	});

	// this.jumping is checked in between operations to make sure we're not stuck
	cancelJumpToMessage = () => {
		this.jumping = false;
	}

	jumpToBottom = () => {
		const { listRef } = this.props;
		listRef.current.getNode().scrollToOffset({ offset: -100 });
	}

	renderFooter = () => {
		const { rid, theme, loading } = this.props;
		if (loading && rid) {
			return <ActivityIndicator theme={theme} />;
		}
		return null;
	}

	renderItem = ({ item, index }) => {
		const { messages, highlightedMessage } = this.state;
		const { renderRow } = this.props;
		return renderRow(item, messages[index + 1], highlightedMessage);
	}

	onViewableItemsChanged = ({ viewableItems }) => {
		this.viewableItems = viewableItems;
	}

	render() {
		console.count(`${ this.constructor.name }.render calls`);
		const { rid, tmid, listRef } = this.props;
		const { messages, refreshing } = this.state;
		const { theme } = this.props;
		return (
			<>
				<EmptyRoom rid={rid} length={messages.length} mounted={this.mounted} theme={theme} />
				<List
					onScroll={this.onScroll}
					scrollEventThrottle={16}
					listRef={listRef}
					data={messages}
					renderItem={this.renderItem}
					onEndReached={this.onEndReached}
					ListFooterComponent={this.renderFooter}
					onScrollToIndexFailed={this.handleScrollToIndexFailed}
					onViewableItemsChanged={this.onViewableItemsChanged}
					viewabilityConfig={this.viewabilityConfig}
					refreshControl={(
						<RefreshControl
							refreshing={refreshing}
							onRefresh={this.onRefresh}
							tintColor={themes[theme].auxiliaryText}
						/>
					)}
				/>
				<NavBottomFAB y={this.y} onPress={this.jumpToBottom} isThread={!!tmid} />
			</>
		);
	}
}

export default ListContainer;
