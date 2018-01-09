import { ListView as OldList } from 'realm/react-native';
import React from 'react';
import cloneReferencedElement from 'react-clone-referenced-element';
import { ScrollView, ListView as OldList2 } from 'react-native';

const DEFAULT_SCROLL_CALLBACK_THROTTLE = 50;

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
export class ListView extends OldList2 {
	constructor(props) {
		super(props);
		this.state = {
			curRenderedRowsCount: this.props.initialListSize,
			highlightedRow: ({}: Object)
		};


		this.renderRow = this.renderRow.bind(this);
	}

	renderRow(_, sectionId, rowId, ...args) {
		const { props } = this;
		const item = props.dataSource.getRow(sectionId, rowId);

		// The item could be null because our data is a snapshot and it was deleted.
		return item ? props.renderRow(item, sectionId, rowId, ...args) : null;
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

		const { dataSource } = this.props;
		const allRowIDs = dataSource.rowIdentities;
		let rowCount = 0;
		// const stickySectionHeaderIndices = [];

		// const { renderSectionHeader } = this.props;

		const header = this.props.renderHeader && this.props.renderHeader();
		const footer = this.props.renderFooter && this.props.renderFooter();
		// let totalIndex = header ? 1 : 0;

		for (let sectionIdx = 0; sectionIdx < allRowIDs.length; sectionIdx += 1) {
			const sectionID = dataSource.sectionIdentities[sectionIdx];
			const rowIDs = allRowIDs[sectionIdx];
			if (rowIDs.length === 0) {
				continue; // eslint-disable-line
			}

			// if (renderSectionHeader) {
			// 	const element = renderSectionHeader(
			// 		dataSource.getSectionHeaderData(sectionIdx),
			// 		sectionID,
			// 	);
			// 	if (element) {
			// 		bodyComponents.push(React.cloneElement(element, { key: `s_${ sectionID }` }), );
			// 		if (this.props.stickySectionHeadersEnabled) {
			// 			stickySectionHeaderIndices.push(totalIndex);
			// 		}
			// 		totalIndex++;
			// 	}
			// }

			for (let rowIdx = 0; rowIdx < rowIDs.length; rowIdx += 1) {
				const rowID = rowIDs[rowIdx];
				const data = dataSource._dataBlob[sectionID][rowID];
				bodyComponents.push(this.props.renderRow.bind(
					null,
					data,
					sectionID,
					rowID,
					this._onRowHighlighted,
				)());
				// totalIndex += 1;
				rowCount += 1;
				if (rowCount === this.state.curRenderedRowsCount) {
					break;
				}
			}
			if (rowCount >= this.state.curRenderedRowsCount) {
				break;
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
