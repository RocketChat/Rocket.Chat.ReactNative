import React from 'react';
import { ActivityIndicator, FlatList } from 'react-native';
import PropTypes from 'prop-types';
import { responsive } from 'react-native-responsive-ui';

import styles from './styles';
import database from '../../lib/realm';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import debounce from '../../utils/debounce';
import RocketChat from '../../lib/rocketchat';
import log from '../../utils/log';
import EmptyRoom from './EmptyRoom';
import ScrollBottomButton from './ScrollBottomButton';

@responsive
export class List extends React.Component {
	static propTypes = {
		onEndReached: PropTypes.func,
		renderFooter: PropTypes.func,
		renderRow: PropTypes.func,
		room: PropTypes.object,
		window: PropTypes.object
	};

	constructor(props) {
		super(props);
		this.data = database
			.objects('messages')
			.filtered('rid = $0', props.room.rid)
			.sorted('ts', true);
		this.state = {
			loading: true,
			loadingMore: false,
			end: false,
			messages: this.data.slice(),
			showScollToBottomButton: false
		};
		this.data.addListener(this.updateState);
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

	componentWillUnmount() {
		this.data.removeAllListeners();
		this.updateState.stop();
	}

	// eslint-disable-next-line react/sort-comp
	updateState = debounce(() => {
		this.setState({ messages: this.data.slice(), loading: false, loadingMore: false });
	}, 300);

	onEndReached = async() => {
		const {
			loadingMore, loading, end, messages
		} = this.state;
		if (loadingMore || loading || end || messages.length < 50) {
			return;
		}

		this.setState({ loadingMore: true });
		const { room } = this.props;
		try {
			const result = await RocketChat.loadMessagesForRoom({ rid: room.rid, t: room.t, latest: this.data[this.data.length - 1].ts });
			this.setState({ end: result.length < 50 });
		} catch (e) {
			this.setState({ loadingMore: false });
			log('ListView.onEndReached', e);
		}
	}

	scrollToBottom = () => {
		requestAnimationFrame(() => {
			this.list.scrollToOffset({ offset: -100 });
		});
	}

	handleScroll = (event) => {
		if (event.nativeEvent.contentOffset.y > 0) {
			this.setState({ showScollToBottomButton: true });
		} else {
			this.setState({ showScollToBottomButton: false });
		}
	}

	renderFooter = () => {
		const { loadingMore, loading } = this.state;
		if (loadingMore || loading) {
			return <ActivityIndicator style={styles.loadingMore} />;
		}
		return null;
	}

	render() {
		const { renderRow, window } = this.props;
		const { showScollToBottomButton, messages } = this.state;
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
					style={styles.list}
					onScroll={this.handleScroll}
					inverted
					removeClippedSubviews
					initialNumToRender={10}
					onEndReached={this.onEndReached}
					onEndReachedThreshold={0.5}
					maxToRenderPerBatch={20}
					ListFooterComponent={this.renderFooter}
					{...scrollPersistTaps}
				/>
				<ScrollBottomButton
					show={showScollToBottomButton}
					onPress={this.scrollToBottom}
					landscape={window.width > window.height}
				/>
			</React.Fragment>
		);
	}
}
