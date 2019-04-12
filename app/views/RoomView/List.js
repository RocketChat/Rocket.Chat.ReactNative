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
// import ScrollBottomButton from './ScrollBottomButton';

export class List extends React.Component {
	static propTypes = {
		onEndReached: PropTypes.func,
		renderFooter: PropTypes.func,
		renderRow: PropTypes.func,
		rid: PropTypes.string,
		t: PropTypes.string,
		window: PropTypes.object
	};

	constructor(props) {
		super(props);
		console.time(`${ this.constructor.name } init`);
		console.time(`${ this.constructor.name } mount`);
		this.data = database
			.objects('messages')
			.filtered('rid = $0', props.rid)
			.sorted('ts', true);
		this.state = {
			loading: true,
			loadingMore: false,
			end: false,
			messages: this.data.slice()
			// showScollToBottomButton: false
		};
		safeAddListener(this.data, this.updateState);
		console.timeEnd(`${ this.constructor.name } init`);
	}

	// shouldComponentUpdate(nextProps, nextState) {
	// 	const {
	// 		loadingMore, loading, end, showScollToBottomButton, messages
	// 	} = this.state;
	// 	const { window } = this.props;
	// 	return end !== nextState.end
	// 		|| loadingMore !== nextState.loadingMore
	// 		|| loading !== nextState.loading
	// 		|| showScollToBottomButton !== nextState.showScollToBottomButton
	// 		// || messages.length !== nextState.messages.length
	// 		|| !equal(messages, nextState.messages)
	// 		|| window.width !== nextProps.window.width;
	// }

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
			this.setState({ messages: this.data.slice(), loading: false, loadingMore: false });
		});
	}, 300);

	onEndReached = async() => {
		const {
			loadingMore, loading, end, messages
		} = this.state;
		if (loadingMore || loading || end || messages.length < 50) {
			return;
		}

		this.setState({ loadingMore: true });
		const { rid, t } = this.props;
		try {
			const result = await RocketChat.loadMessagesForRoom({ rid, t, latest: this.data[this.data.length - 1].ts });
			this.setState({ end: result.length < 50 });
		} catch (e) {
			this.setState({ loadingMore: false });
			log('ListView.onEndReached', e);
		}
	}

	// scrollToBottom = () => {
	// 	requestAnimationFrame(() => {
	// 		this.list.scrollToOffset({ offset: isNotch ? -90 : -60 });
	// 	});
	// }

	// handleScroll = (event) => {
	// 	if (event.nativeEvent.contentOffset.y > 0) {
	// 		this.setState({ showScollToBottomButton: true });
	// 	} else {
	// 		this.setState({ showScollToBottomButton: false });
	// 	}
	// }

	renderFooter = () => {
		const { loadingMore, loading } = this.state;
		if (loadingMore || loading) {
			return <ActivityIndicator style={styles.loadingMore} />;
		}
		return null;
	}

	render() {
		console.count(`${ this.constructor.name }.render calls`);
		const { renderRow } = this.props;
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
					renderItem={({ item, index }) => renderRow(item, messages[index + 1])}
					contentContainerStyle={styles.contentContainer}
					style={styles.list}
					// onScroll={this.handleScroll}
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
				{/* <ScrollBottomButton
					show={showScollToBottomButton}
					onPress={this.scrollToBottom}
					landscape={window.width > window.height}
				/> */}
			</React.Fragment>
		);
	}
}
