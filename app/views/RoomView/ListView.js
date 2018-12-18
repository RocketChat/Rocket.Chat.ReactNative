import { ListView as OldList } from 'realm/react-native';
import React from 'react';
import {
	ScrollView, ListView as OldList2, ImageBackground, ActivityIndicator
} from 'react-native';
import moment from 'moment';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import Separator from './Separator';
import styles from './styles';
import database from '../../lib/realm';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import debounce from '../../utils/debounce';
import RocketChat from '../../lib/rocketchat';
import log from '../../utils/log';

const DEFAULT_SCROLL_CALLBACK_THROTTLE = 100;

export class DataSource extends OldList.DataSource {
	getRowData(sectionIndex: number, rowIndex: number): any {
		const sectionID = this.sectionIdentities[sectionIndex];
		const rowID = this.rowIdentities[sectionIndex][rowIndex];
		return this._getRowData(this._dataBlob, sectionID, rowID);
	}
	_calculateDirtyArrays() { // eslint-disable-line
		return false;
	}
}

const ds = new DataSource({ rowHasChanged: (r1, r2) => r1._id !== r2._id });

export class List extends React.Component {
	static propTypes = {
		onEndReached: PropTypes.func,
		renderFooter: PropTypes.func,
		renderRow: PropTypes.func,
		room: PropTypes.object
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
			end: false
		};
		this.dataSource = ds.cloneWithRows(this.data);
	}

	componentDidMount() {
		this.updateState();
		this.data.addListener(this.updateState);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { loadingMore, loading, end } = this.state;
		return end !== nextState.end || loadingMore !== nextState.loadingMore || loading !== nextState.loading;
	}

	componentWillUnmount() {
		this.data.removeAllListeners();
		this.updateState.stop();
	}

	// eslint-disable-next-line react/sort-comp
	updateState = debounce(() => {
		this.setState({ loading: true });
		this.dataSource = this.dataSource.cloneWithRows(this.data);
		this.setState({ loading: false });
	}, 300);

	onEndReached = async() => {
		const { loadingMore, end } = this.state;
		if (loadingMore || end || this.data.length < 50) {
			return;
		}

		this.setState({ loadingMore: true });
		const { room } = this.props;
		try {
			const result = await RocketChat.loadMessagesForRoom({ rid: room.rid, t: room.t, latest: this.data[this.data.length - 1].ts });
			this.setState({ end: result.length < 50, loadingMore: false });
		} catch (e) {
			this.setState({ loadingMore: false });
			log('ListView.onEndReached', e);
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
		const { renderRow } = this.props;

		return (
			<ListView
				enableEmptySections
				style={styles.list}
				data={this.data}
				keyExtractor={item => item._id}
				onEndReachedThreshold={100}
				renderFooter={this.renderFooter}
				onEndReached={this.onEndReached}
				dataSource={this.dataSource}
				renderRow={(item, previousItem) => renderRow(item, previousItem)}
				initialListSize={1}
				pageSize={20}
				testID='room-view-messages'
				{...scrollPersistTaps}
			/>
		);
	}
}

@connect(state => ({
	lastOpen: state.room.lastOpen
}))
export class ListView extends OldList2 {
	constructor(props) {
		super(props);
		this.state = {
			curRenderedRowsCount: 10
			// highlightedRow: ({}: Object)
		};
	}

	getInnerViewNode() {
		return this.refs.listView.getInnerViewNode();
	}

	scrollTo(...args) {
		this.refs.listView.scrollTo(...args);
	}

	setNativeProps(props) {
		this.refs.listView.setNativeProps(props);
	}

	static DataSource = DataSource;

	render() {
		const bodyComponents = [];

		// const stickySectionHeaderIndices = [];

		// const { renderSectionHeader } = this.props;

		const header = this.props.renderHeader ? this.props.renderHeader() : null;
		const footer = this.props.renderFooter ? this.props.renderFooter() : null;
		// let totalIndex = header ? 1 : 0;

		const { data } = this.props;
		let count = 0;

		for (let i = 0; i < this.state.curRenderedRowsCount && i < data.length; i += 1, count += 1) {
			const message = data[i];
			const previousMessage = data[i + 1];
			bodyComponents.push(this.props.renderRow(message, previousMessage));


			if (!previousMessage) {
				bodyComponents.push(<Separator key={message.ts.toISOString()} ts={message.ts} />);
				continue; // eslint-disable-line
			}

			const showUnreadSeparator = this.props.lastOpen
				&& moment(message.ts).isAfter(this.props.lastOpen)
				&& moment(previousMessage.ts).isBefore(this.props.lastOpen);
			const showDateSeparator = !moment(message.ts).isSame(previousMessage.ts, 'day');

			if (showUnreadSeparator || showDateSeparator) {
				bodyComponents.push(<Separator
					key={message.ts.toISOString()}
					ts={showDateSeparator ? message.ts : null}
					unread={showUnreadSeparator}
				/>);
			}
		}

		const { ...props } = this.props;
		if (!props.scrollEventThrottle) {
			props.scrollEventThrottle = DEFAULT_SCROLL_CALLBACK_THROTTLE;
		}
		if (props.removeClippedSubviews === undefined) {
			props.removeClippedSubviews = true;
		}
		/* $FlowFixMe(>=0.54.0 site=react_native_fb,react_native_oss) This comment
     * suppresses an error found when Flow v0.54 was deployed. To see the error
     * delete this comment and run Flow. */
		Object.assign(props, {
			onScroll: this._onScroll,
			/* $FlowFixMe(>=0.53.0 site=react_native_fb,react_native_oss) This
       * comment suppresses an error when upgrading Flow's support for React.
       * To see the error delete this comment and run Flow. */
			// stickyHeaderIndices: this.props.stickyHeaderIndices.concat(stickySectionHeaderIndices,),

			// Do not pass these events downstream to ScrollView since they will be
			// registered in ListView's own ScrollResponder.Mixin
			onKeyboardWillShow: undefined,
			onKeyboardWillHide: undefined,
			onKeyboardDidShow: undefined,
			onKeyboardDidHide: undefined
		});

		const image = data.length === 0 ? { uri: 'message_empty' } : null;
		return (
			[
				<ImageBackground key='listview-background' source={image} style={styles.imageBackground} />,
				<ScrollView
					key='listview-scroll'
					ref={this._setScrollComponentRef}
					onContentSizeChange={this._onContentSizeChange}
					onLayout={this._onLayout}
					{...props}
				>
					{header}
					{bodyComponents}
					{footer}
				</ScrollView>
			]
		);
	}
}
ListView.DataSource = DataSource;
