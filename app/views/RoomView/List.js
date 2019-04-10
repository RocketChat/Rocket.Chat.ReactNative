import React from 'react';
import { ActivityIndicator, FlatList, InteractionManager } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import database, { safeAddListener } from '../../lib/realm';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import debounce from '../../utils/debounce';
import RocketChat from '../../lib/rocketchat';
import log from '../../utils/log';
import EmptyRoom from './EmptyRoom';

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
		if (props.tmid) {
			this.data = database
				.objects('threadMessages')
				.filtered('rid = $0', props.tmid)
				.sorted('ts', true);
			this.threads = [];
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
		safeAddListener(this.threads, this.updateThreads);
		console.timeEnd(`${ this.constructor.name } init`);
	}

	componentDidMount() {
		console.timeEnd(`${ this.constructor.name } mount`);
	}

	componentWillUnmount() {
		this.data.removeAllListeners();
		if (this.updateState && this.updateState.stop) {
			this.updateState.stop();
		}
		if (this.interactionManager && this.interactionManager.cancel) {
			this.interactionManager.cancel();
		}
		console.countReset(`${ this.constructor.name }.render calls`);
	}

	// eslint-disable-next-line react/sort-comp
	updateState = debounce(() => {
		this.interactionManager = InteractionManager.runAfterInteractions(() => {
			this.setState({ messages: this.data.slice(), loading: false });
		});
	}, 300);

	// eslint-disable-next-line react/sort-comp
	updateThreads = debounce(() => {
		this.interactionManager = InteractionManager.runAfterInteractions(() => {
			this.setState({ threads: this.threads.slice() });
		});
	}, 300);

	onEndReached = async() => {
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
				result = await RocketChat.loadThreadMessages({ tmid, skip: messages.length });
			} else {
				result = await RocketChat.loadMessagesForRoom({ rid, t, latest: messages[messages.length - 1].ts });
			}

			this.setState({ end: result.length < 50 });
		} catch (e) {
			this.setState({ loading: false });
			log('ListView.onEndReached', e);
		}
	}

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
				item = { ...item, tmsg: thread.msg };
			}
		}
		return renderRow(item, messages[index + 1]);
	}

	render() {
		console.count(`${ this.constructor.name }.render calls`);
		const { messages } = this.state;
		return (
			<React.Fragment>
				<EmptyRoom length={messages.length} />
				<FlatList
					testID='room-view-messages'
					ref={ref => this.list = ref}
					keyExtractor={item => item._id}
					data={messages}
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
