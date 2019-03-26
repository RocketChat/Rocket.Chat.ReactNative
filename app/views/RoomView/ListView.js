import React from 'react';
import {
	TouchableOpacity, ImageBackground, ActivityIndicator, FlatList
} from 'react-native';
import moment from 'moment';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { responsive } from 'react-native-responsive-ui';

import Separator from './Separator';
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

	shouldComponentUpdate(nextProps, nextState) {
		const {
			loadingMore, loading, end, showScollToBottomButton, messages
		} = this.state;
		const { window } = this.props;
		return end !== nextState.end
			|| loadingMore !== nextState.loadingMore
			|| loading !== nextState.loading
			|| showScollToBottomButton !== nextState.showScollToBottomButton
			|| messages.length !== nextState.messages.length
			|| window.width !== nextProps.window.width;
	}

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
		this.list.scrollToOffset({ offset: -100 });
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
					renderItem={({ item, index }) => renderRow(item, messages[index - 1])}
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

// @connect(state => ({
// 	lastOpen: state.room.lastOpen
// }), null, null, { forwardRef: true })
// export class ListView extends OldList2 {
// 	constructor(props) {
// 		super(props);
// 		this.state = {
// 			curRenderedRowsCount: 10
// 			// highlightedRow: ({}: Object)
// 		};
// 	}

// 	getInnerViewNode() {
// 		return this.refs.listView.getInnerViewNode();
// 	}

// 	scrollTo(...args) {
// 		this.refs.listView.scrollTo(...args);
// 	}

// 	setNativeProps(props) {
// 		this.refs.listView.setNativeProps(props);
// 	}

// 	static DataSource = DataSource;

// 	render() {
// 		const bodyComponents = [];

// 		// const stickySectionHeaderIndices = [];

// 		// const { renderSectionHeader } = this.props;

// 		const header = this.props.renderHeader ? this.props.renderHeader() : null;
// 		const footer = this.props.renderFooter ? this.props.renderFooter() : null;
// 		// let totalIndex = header ? 1 : 0;

// 		const { data } = this.props;
// 		let count = 0;

// 		for (let i = 0; i < this.state.curRenderedRowsCount && i < data.length; i += 1, count += 1) {
// 			const message = data[i];
// 			const previousMessage = data[i + 1];
// 			bodyComponents.push(this.props.renderRow(message, previousMessage));


// 			if (!previousMessage) {
// 				bodyComponents.push(<Separator key={message.ts.toISOString()} ts={message.ts} />);
// 				continue; // eslint-disable-line
// 			}

// 			const showUnreadSeparator = this.props.lastOpen
// 				&& moment(message.ts).isAfter(this.props.lastOpen)
// 				&& moment(previousMessage.ts).isBefore(this.props.lastOpen);
// 			const showDateSeparator = !moment(message.ts).isSame(previousMessage.ts, 'day');

// 			if (showUnreadSeparator || showDateSeparator) {
// 				bodyComponents.push(<Separator
// 					key={message.ts.toISOString()}
// 					ts={showDateSeparator ? message.ts : null}
// 					unread={showUnreadSeparator}
// 				/>);
// 			}
// 		}

// 		const { ...props } = this.props;
// 		if (!props.scrollEventThrottle) {
// 			props.scrollEventThrottle = DEFAULT_SCROLL_CALLBACK_THROTTLE;
// 		}
// 		if (props.removeClippedSubviews === undefined) {
// 			props.removeClippedSubviews = true;
// 		}
// 		/* $FlowFixMe(>=0.54.0 site=react_native_fb,react_native_oss) This comment
//      * suppresses an error found when Flow v0.54 was deployed. To see the error
//      * delete this comment and run Flow. */
// 		Object.assign(props, {
// 			onScroll: this._onScroll,
// 			/* $FlowFixMe(>=0.53.0 site=react_native_fb,react_native_oss) This
//        * comment suppresses an error when upgrading Flow's support for React.
//        * To see the error delete this comment and run Flow. */
// 			// stickyHeaderIndices: this.props.stickyHeaderIndices.concat(stickySectionHeaderIndices,),

// 			// Do not pass these events downstream to ScrollView since they will be
// 			// registered in ListView's own ScrollResponder.Mixin
// 			onKeyboardWillShow: undefined,
// 			onKeyboardWillHide: undefined,
// 			onKeyboardDidShow: undefined,
// 			onKeyboardDidHide: undefined
// 		});

// 		const image = data.length === 0 ? { uri: 'message_empty' } : null;
// 		return (
// 			[
// 				<ImageBackground key='listview-background' source={image} style={styles.imageBackground} />,
// 				<ScrollView
// 					key='listview-scroll'
// 					ref={this._setScrollComponentRef}
// 					onContentSizeChange={this._onContentSizeChange}
// 					onLayout={this._onLayout}
// 					{...props}
// 				>
// 					{header}
// 					{bodyComponents}
// 					{footer}
// 				</ScrollView>
// 			]
// 		);
// 	}
// }
// ListView.DataSource = DataSource;
