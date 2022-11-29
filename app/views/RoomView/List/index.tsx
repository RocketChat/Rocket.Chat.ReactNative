import { Q } from '@nozbe/watermelondb';
import { dequal } from 'dequal';
import moment from 'moment';
import React from 'react';
import { FlatListProps, ViewToken, RefreshControl } from 'react-native';
import { event, Value } from 'react-native-reanimated';
import { Observable, Subscription } from 'rxjs';

import ActivityIndicator from '../../../containers/ActivityIndicator';
import { MessageType, TAnyMessage, TMessageModel, TThreadMessageModel, TThreadModel } from '../../../definitions';
import database from '../../../lib/database';
import { compareServerVersion, debounce } from '../../../lib/methods/helpers';
// import { animateNextTransition } from '../../../lib/methods/helpers/layoutAnimation';
import log from '../../../lib/methods/helpers/log';
import EmptyRoom from '../EmptyRoom';
// @ts-ignore
import List, { IListProps, TListRef } from './List';
import NavBottomFAB from './NavBottomFAB';
import { loadMissedMessages, loadThreadMessages } from '../../../lib/methods';
import { Services } from '../../../lib/services';
import { TSupportedThemes, withTheme } from '../../../theme';
import { MESSAGE_TYPE_ANY_LOAD, themes } from '../../../lib/constants';
import { TMessage } from '../definitions';

const QUERY_SIZE = 50;

const onScroll = ({ y }: { y: Value<number> }) =>
	event(
		[
			{
				nativeEvent: {
					contentOffset: { y }
				}
			}
		],
		{ useNativeDriver: true }
	);

export { IListProps };

export interface IListContainerProps {
	renderRow: Function;
	rid: string;
	tmid?: string;
	loading: boolean;
	listRef: TListRef;
	hideSystemMessages?: string[];
	tunread?: string[];
	ignored?: string[];
	navigation: any; // TODO: type me
	showMessageInMainThread: boolean;
	serverVersion: string | null;
	theme?: TSupportedThemes;
}

interface IListContainerState {
	messages: TMessage[];
	refreshing: boolean;
	highlightedMessage: string | null;
}

class ListContainer extends React.Component<IListContainerProps, IListContainerState> {
	private count = 0;
	private mounted = false;
	private animated = false;
	private jumping = false;
	private cancelJump = false;
	private y = new Value(0);
	private onScroll = onScroll({ y: this.y });
	private unsubscribeFocus: () => void;
	private viewabilityConfig = {
		itemVisiblePercentThreshold: 10
	};
	private highlightedMessageTimeout: ReturnType<typeof setTimeout> | undefined | false;
	private thread?: TThreadModel;
	private messagesObservable?: Observable<TMessageModel[] | TThreadMessageModel[]>;
	private messagesSubscription?: Subscription;
	private viewableItems?: ViewToken[];

	constructor(props: IListContainerProps) {
		super(props);
		console.time(`${this.constructor.name} init`);
		console.time(`${this.constructor.name} mount`);
		this.state = {
			messages: [],
			refreshing: false,
			highlightedMessage: null
		};
		this.query();
		this.unsubscribeFocus = props.navigation.addListener('focus', () => {
			this.animated = true;
		});
		console.timeEnd(`${this.constructor.name} init`);
	}

	componentDidMount() {
		this.mounted = true;
		console.timeEnd(`${this.constructor.name} mount`);
	}

	componentDidUpdate(prevProps: IListContainerProps) {
		const { hideSystemMessages } = this.props;
		if (!dequal(hideSystemMessages, prevProps.hideSystemMessages)) {
			this.reload();
		}
	}

	componentWillUnmount() {
		this.unsubscribeMessages();
		if (this.unsubscribeFocus) {
			this.unsubscribeFocus();
		}
		this.clearHighlightedMessageTimeout();
		console.countReset(`${this.constructor.name}.render calls`);
	}

	// clears previous highlighted message timeout, if exists
	clearHighlightedMessageTimeout = () => {
		if (this.highlightedMessageTimeout) {
			clearTimeout(this.highlightedMessageTimeout);
			this.highlightedMessageTimeout = false;
		}
	};

	query = async () => {
		this.count += QUERY_SIZE;
		const { rid, tmid, showMessageInMainThread, serverVersion } = this.props;
		const db = database.active;

		// handle servers with version < 3.0.0
		let { hideSystemMessages = [] } = this.props;
		if (!Array.isArray(hideSystemMessages)) {
			hideSystemMessages = [];
		}

		if (tmid) {
			try {
				this.thread = await db.get('threads').find(tmid);
			} catch (e) {
				console.log(e);
			}
			this.messagesObservable = db
				.get('thread_messages')
				.query(Q.where('rid', tmid), Q.experimentalSortBy('ts', Q.desc), Q.experimentalSkip(0), Q.experimentalTake(this.count))
				.observeWithColumns(['_updated_at']);
		} else if (rid) {
			const whereClause = [
				Q.where('rid', rid),
				Q.experimentalSortBy('ts', Q.desc),
				Q.experimentalSkip(0),
				Q.experimentalTake(this.count)
			] as (Q.WhereDescription | Q.Or)[];
			if (!showMessageInMainThread) {
				whereClause.push(Q.or(Q.where('tmid', null), Q.where('tshow', Q.eq(true))));
			}
			this.messagesObservable = db
				.get('messages')
				.query(...whereClause)
				.observeWithColumns(['_updated_at', 'status']);
		}

		if (rid) {
			this.unsubscribeMessages();
			this.messagesSubscription = this.messagesObservable?.subscribe(messages => {
				let data = messages.map(m => {
					if ((MESSAGE_TYPE_ANY_LOAD as MessageType[]).includes(m.t)) {
						return m;
					}

					return m.asPlain();
				});

				if (tmid && this.thread) {
					data = [...messages, this.thread];
				}

				/**
				 * Since 3.16.0 server version, the backend don't response with messages if
				 * hide system message is enabled
				 */
				if (compareServerVersion(serverVersion, 'lowerThan', '3.16.0') || hideSystemMessages.length) {
					data = messages.filter(m => !m.t || !hideSystemMessages?.includes(m.t));
				}

				if (this.mounted) {
					// if (this.animated) {
					// 	listRef.current?.prepareForLayoutAnimationRender();
					// 	animateNextTransition();
					// }
					this.setState({ messages: data });
				} else {
					// @ts-ignore
					this.state.messages = data;
				}
				// TODO: move it away from here
				this.readThreads();
			});
		}
	};

	reload = () => {
		this.count = 0;
		this.query();
	};

	readThreads = debounce(async () => {
		const { tmid } = this.props;

		if (tmid) {
			try {
				await Services.readThreads(tmid);
			} catch {
				// Do nothing
			}
		}
	}, 300);

	onEndReached = () => this.query();

	onRefresh = () =>
		this.setState({ refreshing: true }, async () => {
			const { messages } = this.state;
			const { rid, tmid } = this.props;

			if (messages.length) {
				try {
					if (tmid) {
						await loadThreadMessages({ tmid, rid });
					} else {
						await loadMissedMessages({ rid, lastOpen: moment().subtract(7, 'days').toDate() });
					}
				} catch (e) {
					log(e);
				}
			}

			this.setState({ refreshing: false });
		});

	unsubscribeMessages = () => {
		if (this.messagesSubscription && this.messagesSubscription.unsubscribe) {
			this.messagesSubscription.unsubscribe();
		}
	};

	getLastMessage = (): TAnyMessage | null => {
		const { messages } = this.state;
		if (messages.length > 0) {
			return messages[0];
		}
		return null;
	};

	handleScrollToIndexFailed: FlatListProps<any>['onScrollToIndexFailed'] = params => {
		const { listRef } = this.props;
		listRef.current?.scrollToIndex({ index: params.highestMeasuredFrameIndex, animated: false });
	};

	jumpToMessage = (messageId: string) =>
		new Promise<void>(async resolve => {
			const { messages } = this.state;
			const { listRef } = this.props;

			// if jump to message was cancelled, reset variables and stop
			if (this.cancelJump) {
				this.resetJumpToMessage();
				return resolve();
			}
			this.jumping = true;

			// look for the message on the state
			const index = messages.findIndex(item => item.id === messageId);

			// if found message, scroll to it
			if (index > -1) {
				listRef.current?.scrollToIndex({ index, viewPosition: 0.5, viewOffset: 100 });

				// wait for scroll animation to finish
				await new Promise(res => setTimeout(res, 300));

				// if message is not visible
				if (!this.viewableItems?.map(vi => vi.key).includes(messageId)) {
					await setTimeout(() => resolve(this.jumpToMessage(messageId)), 300);
					return;
				}
				// if message is visible, highlight it
				this.setState({ highlightedMessage: messageId });
				this.clearHighlightedMessageTimeout();
				// clears highlighted message after some time
				this.highlightedMessageTimeout = setTimeout(() => {
					this.setState({ highlightedMessage: null });
				}, 5000);
				this.resetJumpToMessage();
				resolve();
			} else {
				// if message not found, wait for scroll to top and then jump to message
				listRef.current?.scrollToIndex({ index: messages.length - 1, animated: true });
				await setTimeout(() => resolve(this.jumpToMessage(messageId)), 300);
			}
		});

	resetJumpToMessage = () => {
		this.cancelJump = false;
		this.jumping = false;
	};

	cancelJumpToMessage = () => {
		if (this.jumping) {
			this.cancelJump = true;
			return;
		}
		this.resetJumpToMessage();
	};

	jumpToBottom = () => {
		const { listRef } = this.props;
		listRef.current?.scrollToOffset({ offset: -100 });
	};

	renderFooter = () => {
		const { rid, loading } = this.props;
		if (loading && rid) {
			return <ActivityIndicator />;
		}
		return null;
	};

	renderItem: FlatListProps<any>['renderItem'] = ({ item, index }) => {
		const { messages, highlightedMessage } = this.state;
		const { renderRow } = this.props;
		return renderRow(item, messages[index + 1], highlightedMessage);
	};

	onViewableItemsChanged: FlatListProps<any>['onViewableItemsChanged'] = ({ viewableItems }) => {
		this.viewableItems = viewableItems;
	};

	render() {
		console.count(`${this.constructor.name}.render calls`);
		const { rid, tmid, listRef, theme, loading } = this.props;
		const { messages, refreshing } = this.state;
		return (
			<>
				<EmptyRoom rid={rid} length={messages.length} mounted={this.mounted} />
				<List
					onScroll={this.onScroll}
					scrollEventThrottle={16}
					listRef={listRef}
					data={messages}
					extraData={loading}
					// @ts-ignore
					renderItem={this.renderItem}
					onEndReached={this.onEndReached}
					ListFooterComponent={this.renderFooter}
					onScrollToIndexFailed={this.handleScrollToIndexFailed}
					onViewableItemsChanged={this.onViewableItemsChanged}
					viewabilityConfig={this.viewabilityConfig}
					nativeID={tmid || rid}
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={this.onRefresh} tintColor={themes[theme!].auxiliaryText} />
					}
				/>
				<NavBottomFAB y={this.y} onPress={this.jumpToBottom} isThread={!!tmid} />
			</>
		);
	}
}

export type ListContainerType = ListContainer;

export default withTheme(ListContainer);
