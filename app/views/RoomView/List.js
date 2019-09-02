/* eslint-disable react/sort-comp */
import React from 'react';
import { ActivityIndicator, FlatList, InteractionManager } from 'react-native';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import orderBy from 'lodash/orderBy';
import equal from 'deep-equal';
import { throttleTime, debounceTime } from 'rxjs/operators';

import styles from './styles';
import database, { safeAddListener } from '../../lib/realm';
import watermelon from '../../lib/database';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import RocketChat from '../../lib/rocketchat';
import log from '../../utils/log';
import EmptyRoom from './EmptyRoom';
import { Q } from '@nozbe/watermelondb';

export class List extends React.Component {
	static propTypes = {
		onEndReached: PropTypes.func,
		renderFooter: PropTypes.func,
		renderRow: PropTypes.func,
		rid: PropTypes.string,
		t: PropTypes.string,
		tmid: PropTypes.string
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

	async init() {
		const { rid, tmid } = this.props;

		if (tmid) {
			this.thread = await watermelon.database.collections
				.get('threads')
				.find(tmid);
			this.messagesObservable = watermelon.database.collections
				.get('thread_messages')
				.query(
					Q.where('tmid', tmid)
				)
				.observeWithColumns(['updated_at']);
		} else {
			this.messagesObservable = watermelon.database.collections
				.get('messages')
				.query(
					Q.where('rid', rid)
				)
				.observeWithColumns(['updated_at']);
		}

		this.messagesSubscription = this.messagesObservable
			// .pipe(throttleTime(300))
			.subscribe((data) => {
				if (tmid) {
					delete data.tlm;
					data = [this.thread, ...data];
				}
				const messages = orderBy(data, ['ts'], ['desc']);
				if (this.mounted) {
					this.setState({ messages });
				} else {
					this.state.messages = messages;
				}
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

	// shouldComponentUpdate(nextProps, nextState) {
	// 	const { messages } = this.state;
	// 	if (!equal(messages, nextState.messages)) {
	// 		return true;
	// 	}
	// 	return false;
	// }

	// componentWillUnmount() {
	// 	this.data.removeAllListeners();
	// 	this.threads.removeAllListeners();
	// 	if (this.updateState && this.updateState.stop) {
	// 		this.updateState.stop();
	// 	}
	// 	if (this.interactionManagerState && this.interactionManagerState.cancel) {
	// 		this.interactionManagerState.cancel();
	// 	}
	// 	console.countReset(`${ this.constructor.name }.render calls`);
	// }

	// eslint-disable-next-line react/sort-comp
	// updateState = debounce(() => {
	// 	this.interactionManagerState = InteractionManager.runAfterInteractions(() => {
	// 		const { tmid } = this.props;
	// 		let messages = this.data;
	// 		if (tmid && this.threads[0]) {
	// 			const thread = { ...this.threads[0] };
	// 			thread.tlm = null;
	// 			messages = [...messages, thread];
	// 		}
	// 		this.setState({
	// 			messages: messages.slice(),
	// 			threads: this.threads.slice(),
	// 			loading: false
	// 		});
	// 	});
	// }, 300, { leading: true });

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
				result = await RocketChat.loadThreadMessages({ tmid, offset: messages.length - 1 });
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
				<EmptyRoom length={messages.length} />
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
					// removeClippedSubviews
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
