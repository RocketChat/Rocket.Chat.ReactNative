import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import {
	toggleServerDropdown, closeServerDropdown, closeSortDropdown, setSearch as setSearchAction
} from '../../../actions/rooms';
import Header from './Header';

@connect(state => ({
	showServerDropdown: state.rooms.showServerDropdown,
	showSortDropdown: state.rooms.showSortDropdown,
	showSearchHeader: state.rooms.showSearchHeader,
	connecting: state.meteor.connecting,
	isFetching: state.rooms.isFetching,
	serverName: state.settings.Site_Name
}), dispatch => ({
	close: () => dispatch(closeServerDropdown()),
	open: () => dispatch(toggleServerDropdown()),
	closeSort: () => dispatch(closeSortDropdown()),
	setSearch: searchText => dispatch(setSearchAction(searchText))
}))
export default class RoomsListHeaderView extends PureComponent {
	static propTypes = {
		showServerDropdown: PropTypes.bool,
		showSortDropdown: PropTypes.bool,
		showSearchHeader: PropTypes.bool,
		serverName: PropTypes.string,
		connecting: PropTypes.bool,
		isFetching: PropTypes.bool,
		open: PropTypes.func,
		close: PropTypes.func,
		closeSort: PropTypes.func,
		setSearch: PropTypes.func
	}

	componentDidUpdate(prevProps) {
		const { showSearchHeader } = this.props;
		if (showSearchHeader && prevProps.showSearchHeader !== showSearchHeader) {
			setTimeout(() => {
				this.searchInputRef.focus();
			}, 300);
		}
	}

	onSearchChangeText = (text) => {
		const { setSearch } = this.props;
		setSearch(text.trim());
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

	setSearchInputRef = (ref) => {
		this.searchInputRef = ref;
	}

	render() {
		const {
			serverName, showServerDropdown, showSearchHeader, connecting, isFetching
		} = this.props;

		return (
			<Header
				serverName={serverName}
				showServerDropdown={showServerDropdown}
				showSearchHeader={showSearchHeader}
				connecting={connecting}
				isFetching={isFetching}
				setSearchInputRef={this.setSearchInputRef}
				onPress={this.onPress}
				onSearchChangeText={text => this.onSearchChangeText(text)}
			/>
		);
	}
}
