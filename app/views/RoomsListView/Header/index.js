import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { toggleServerDropdown, closeServerDropdown, closeSortDropdown } from '../../../actions/rooms';
import Header from './Header';

@connect(state => ({
	showServerDropdown: state.rooms.showServerDropdown,
	showSortDropdown: state.rooms.showSortDropdown,
	serverName: state.settings.Site_Name
}), dispatch => ({
	close: () => dispatch(closeServerDropdown()),
	open: () => dispatch(toggleServerDropdown()),
	closeSort: () => dispatch(closeSortDropdown())
}))
export default class RoomsListHeaderView extends Component {
	static propTypes = {
		showServerDropdown: PropTypes.bool,
		showSortDropdown: PropTypes.bool,
		serverName: PropTypes.string,
		open: PropTypes.func,
		close: PropTypes.func,
		closeSort: PropTypes.func
	}

	onPress = () => {
		const {
			showServerDropdown, showSortDropdown, close, open, closeSort
		} = this.props;
		if (showServerDropdown) {
			close();
		} else if (showSortDropdown) {
			closeSort();
			setTimeout(() => {
				open();
			}, 300);
		} else {
			open();
		}
	}

	render() {
		const { serverName, showServerDropdown } = this.props;
		return (
			<Header
				onPress={this.onPress}
				serverName={serverName}
				showServerDropdown={showServerDropdown}
			/>
		);
	}
}
