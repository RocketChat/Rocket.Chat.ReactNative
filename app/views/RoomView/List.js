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
		t: PropTypes.string
	};

	constructor(props) {
		super(props);
		console.time(`${ this.constructor.name } init`);
		console.time(`${ this.constructor.name } mount`);
		if (props.tmid) {
			this.data = database
				.objects('threads')
				.filtered('rid = $0', props.tmid)
				.sorted('ts', false);
		} else {
			this.data = database
				.objects('messages')
				.filtered('rid = $0', props.rid)
				.sorted('ts', true);
		}

		this.state = {
			loading: true,
			end: false,
			messages: this.data.slice()
		};
		safeAddListener(this.data, this.updateState);
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

	onEndReached = async() => {
		const {
			loading, end, messages
		} = this.state;
		if (loading || end || messages.length < 50) {
			return;
		}

		this.setState({ loading: true });
		const { rid, t } = this.props;
		try {
			const result = await RocketChat.loadMessagesForRoom({ rid, t, latest: this.data[this.data.length - 1].ts });
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
		const { messages } = this.state;
		const { renderRow, tmid } = this.props;
		if (tmid) {
			return renderRow(item, messages[index - 1]);
		} else {
			return renderRow(item, messages[index + 1]);
		}
	}

	render() {
		console.count(`${ this.constructor.name }.render calls`);
		const { messages } = this.state;
		const { t, tmid } = this.props;
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
					inverted={!tmid}
					removeClippedSubviews
					initialNumToRender={1}
					// onEndReached={this.onEndReached}
					// onEndReachedThreshold={0.5}
					maxToRenderPerBatch={5}
					windowSize={21}
					ListFooterComponent={this.renderFooter}
					{...scrollPersistTaps}
				/>
			</React.Fragment>
		);
	}
}
