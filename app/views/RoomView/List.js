import React from 'react';
import { ActivityIndicator, FlatList, InteractionManager } from 'react-native';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';

import styles from './styles';
import database, { safeAddListener } from '../../lib/realm';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import RocketChat from '../../lib/rocketchat';
import log from '../../utils/log';
import EmptyRoom from './EmptyRoom';

export class List extends React.PureComponent {
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
		if (props.tmid) {
			this.data = database
				.objects('threadMessages')
				.filtered('rid = $0', props.tmid)
				.sorted('ts', true);
			this.threads = database.objects('threads').filtered('_id = $0', props.tmid);
		} else {
			this.data = database
				.objects('messages')
				.filtered('rid = $0', props.rid)
				.sorted('ts', true);
			this.threads = database.objects('threads').filtered('rid = $0', props.rid);
		}

		this.state = {
			loading: true,
			end: false,
			messages: this.data.slice(),
			threads: this.threads.slice()
		};

		safeAddListener(this.data, this.updateState);
		console.timeEnd(`${ this.constructor.name } init`);
	}

	componentDidMount() {
		console.timeEnd(`${ this.constructor.name } mount`);
	}

	componentWillUnmount() {
		this.data.removeAllListeners();
		this.threads.removeAllListeners();
		if (this.updateState && this.updateState.stop) {
			this.updateState.stop();
		}
		if (this.updateThreads && this.updateThreads.stop) {
			this.updateThreads.stop();
		}
		if (this.interactionManagerState && this.interactionManagerState.cancel) {
			this.interactionManagerState.cancel();
		}
		if (this.interactionManagerThreads && this.interactionManagerThreads.cancel) {
			this.interactionManagerThreads.cancel();
		}
		console.countReset(`${ this.constructor.name }.render calls`);
	}

	// eslint-disable-next-line react/sort-comp
	updateState = debounce(() => {
		this.interactionManagerState = InteractionManager.runAfterInteractions(() => {
			this.setState({
				messages: this.data.slice(),
				threads: this.threads.slice(),
				loading: false
			});
		});
	}, 300, { leading: true });

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
				result = await RocketChat.loadThreadMessages({ tmid, offset: messages.length });
			} else {
				result = await RocketChat.loadMessagesForRoom({ rid, t, latest: messages[messages.length - 1].ts });
			}

			this.setState({ end: result.length < 50, loading: false });
		} catch (e) {
			this.setState({ loading: false });
			log('ListView.onEndReached', e);
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
		const { messages, threads } = this.state;
		const { renderRow } = this.props;
		if (item.tmid) {
			const thread = threads.find(t => t._id === item.tmid);
			if (thread) {
				const tmsg = thread.msg || (thread.attachments && thread.attachments.length && thread.attachments[0].title);
				item = { ...item, tmsg };
			}
		}
		return renderRow(item, messages[index + 1]);
	}

	render() {
		console.count(`${ this.constructor.name }.render calls`);
		const { messages, threads } = this.state;
		const { tmid } = this.props;
		let data = [];
		if (tmid) {
			const thread = { ...threads[0] };
			thread.tlm = null;
			data = [...messages, thread];
		} else {
			data = messages;
		}
		return (
			<React.Fragment>
				<EmptyRoom length={data.length} />
				<FlatList
					testID='room-view-messages'
					ref={ref => this.list = ref}
					keyExtractor={item => item._id}
					data={data}
					extraData={this.state}
					renderItem={this.renderItem}
					contentContainerStyle={styles.contentContainer}
					style={styles.list}
					inverted
					removeClippedSubviews
					initialNumToRender={1}
					onEndReached={this.onEndReached}
					onEndReachedThreshold={0.5}
					maxToRenderPerBatch={5}
					windowSize={21}
					ListFooterComponent={this.renderFooter}
					{...scrollPersistTaps}
				/>
			</React.Fragment>
		);
	}
}
