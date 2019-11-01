import React from 'react';
import {
	ActivityIndicator, FlatList, InteractionManager
} from 'react-native';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import orderBy from 'lodash/orderBy';
import { Q } from '@nozbe/watermelondb';
import isEqual from 'lodash/isEqual';

import styles from './styles';
import database from '../../lib/database';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import RocketChat from '../../lib/rocketchat';
import log from '../../utils/log';
import EmptyRoom from './EmptyRoom';
import { isIOS } from '../../utils/deviceInfo';
import { animateNextTransition } from '../../utils/layoutAnimation';

export class List extends React.Component {
	static propTypes = {
		onEndReached: PropTypes.func,
		renderFooter: PropTypes.func,
		renderRow: PropTypes.func,
		rid: PropTypes.string,
		t: PropTypes.string,
		tmid: PropTypes.string,
		animated: PropTypes.bool
	};

	constructor(props) {
		super(props);
		console.time(`${ this.constructor.name } init`);
		console.time(`${ this.constructor.name } mount`);

		this.mounted = false;
		this.state = {
			loading: true,
			end: false,
			messages: []
		};
		this.init();
		console.timeEnd(`${ this.constructor.name } init`);
	}

	componentDidMount() {
		this.mounted = true;
		console.timeEnd(`${ this.constructor.name } mount`);
	}

	// eslint-disable-next-line react/sort-comp
	async init() {
		const { rid, tmid } = this.props;
		const db = database.active;

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
					Q.where('rid', tmid)
				)
				.observeWithColumns(['_updated_at']);
		} else {
			this.messagesObservable = db.collections
				.get('messages')
				.query(
					Q.where('rid', rid)
				)
				.observeWithColumns(['_updated_at']);
		}

		this.messagesSubscription = this.messagesObservable
			.subscribe((data) => {
				this.interaction = InteractionManager.runAfterInteractions(() => {
					if (tmid) {
						data = [this.thread, ...data];
					}
					const messages = orderBy(data, ['ts'], ['desc']);
					if (this.mounted) {
						animateNextTransition();
						this.setState({ messages });
					} else {
						this.state.messages = messages;
					}
				});
			});
	}

	// this.state.loading works for this.onEndReached and RoomView.init
	static getDerivedStateFromProps(props, state) {
		if (props.loading !== state.loading) {
			return {
				loading: props.loading
			};
		}
		return null;
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { messages, loading, end } = this.state;
		if (loading !== nextState.loading) {
			return true;
		}
		if (end !== nextState.end) {
			return true;
		}
		if (!isEqual(messages, nextState.messages)) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		if (this.messagesSubscription && this.messagesSubscription.unsubscribe) {
			this.messagesSubscription.unsubscribe();
		}
		if (this.interaction && this.interaction.cancel) {
			this.interaction.cancel();
		}
		if (this.onEndReached && this.onEndReached.stop) {
			this.onEndReached.stop();
		}
		console.countReset(`${ this.constructor.name }.render calls`);
	}

	onEndReached = debounce(async() => {
		const {
			loading, end, messages
		} = this.state;
		if (loading || end || messages.length < 50) {
			return;
		}

		this.setState({ loading: true });
		const { rid, t, tmid } = this.props;
		try {
			let result;
			if (tmid) {
				// `offset` is `messages.length - 1` because we append thread start to `messages` obj
				result = await RocketChat.loadThreadMessages({ tmid, rid, offset: messages.length - 1 });
			} else {
				result = await RocketChat.loadMessagesForRoom({ rid, t, latest: messages[messages.length - 1].ts });
			}

			this.setState({ end: result.length < 50, loading: false });
		} catch (e) {
			this.setState({ loading: false });
			log(e);
		}
	}, 300)

	renderFooter = () => {
		const { loading } = this.state;
		if (loading) {
			return <ActivityIndicator style={styles.loading} />;
		}
		return null;
	}

	renderItem = ({ item, index }) => {
		const { messages } = this.state;
		const { renderRow } = this.props;
		return renderRow(item, messages[index + 1]);
	}

	render() {
		console.count(`${ this.constructor.name }.render calls`);
		const { messages } = this.state;
		return (
			<>
				<EmptyRoom length={messages.length} mounted={this.mounted} />
				<FlatList
					testID='room-view-messages'
					ref={ref => this.list = ref}
					keyExtractor={item => item.id}
					data={messages}
					extraData={this.state}
					renderItem={this.renderItem}
					contentContainerStyle={styles.contentContainer}
					style={styles.list}
					inverted
					removeClippedSubviews={isIOS}
					initialNumToRender={7}
					onEndReached={this.onEndReached}
					onEndReachedThreshold={5}
					maxToRenderPerBatch={5}
					windowSize={10}
					ListFooterComponent={this.renderFooter}
					{...scrollPersistTaps}
				/>
			</>
		);
	}
}
