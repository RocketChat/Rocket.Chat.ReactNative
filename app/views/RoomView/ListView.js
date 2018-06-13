import { ListView as OldList } from 'realm/react-native';
import React from 'react';
import cloneReferencedElement from 'react-clone-referenced-element';
import { ScrollView, ListView as OldList2, LayoutAnimation } from 'react-native';
import moment from 'moment';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import Separator from './Separator';
import styles from './styles';
import Typing from '../../containers/Typing';
import database from '../../lib/realm';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import throttle from '../../utils/throttle';

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

const ds = new DataSource({ rowHasChanged: (r1, r2) => r1._id !== r2._id || r1._updatedAt.toISOString() !== r2._updatedAt.toISOString() });

export class List extends React.Component {
	static propTypes = {
		onEndReached: PropTypes.func,
		renderFooter: PropTypes.func,
		renderRow: PropTypes.func,
		room: PropTypes.string,
		end: PropTypes.bool
	};
	constructor(props) {
		super(props);
		this.data = database
			.objects('messages')
			.filtered('rid = $0', props.room)
			.sorted('ts', true);
		this.dataSource = ds.cloneWithRows(this.data);
	}
	componentDidMount() {
		this.data.addListener(this.updateState);
	}
	shouldComponentUpdate(nextProps) {
		return this.props.end !== nextProps.end;
	}
	componentWillUnmount() {
		this.data.removeAllListeners();
		this.updateState.stop();
	}
	updateState = throttle(() => {
		// this.setState({
		this.dataSource = this.dataSource.cloneWithRows(this.data);
		LayoutAnimation.easeInEaseOut();
		this.forceUpdate();
		// });
	}, 1000);

	render() {
		return (<ListView
			enableEmptySections
			style={styles.list}
			data={this.data}
			keyExtractor={item => item._id}
			onEndReachedThreshold={100}
			renderFooter={this.props.renderFooter}
			renderHeader={() => <Typing />}
			onEndReached={() => this.props.onEndReached(this.data[this.data.length - 1])}
			dataSource={this.dataSource}
			renderRow={(item, previousItem) => this.props.renderRow(item, previousItem)}
			initialListSize={20}
			pageSize={20}
			testID='room-view-messages'
			{...scrollPersistTaps}
		/>);
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

			const showUnreadSeparator = this.props.lastOpen &&
				moment(message.ts).isAfter(this.props.lastOpen) &&
				moment(previousMessage.ts).isBefore(this.props.lastOpen);
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

		return cloneReferencedElement(
			<ScrollView {...props} />,
			{
				ref: this._setScrollComponentRef,
				onContentSizeChange: this._onContentSizeChange,
				onLayout: this._onLayout
			},
			header,
			bodyComponents,
			footer,
		);
	}
}
ListView.DataSource = DataSource;
