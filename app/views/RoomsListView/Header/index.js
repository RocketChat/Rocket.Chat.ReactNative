import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import {
	toggleServerDropdown, closeServerDropdown, closeSortDropdown, setSearch as setSearchAction
} from '../../../actions/rooms';
import Header from './Header';

class RoomsListHeaderView extends PureComponent {
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
				onPress={this.onPress}
				onSearchChangeText={text => this.onSearchChangeText(text)}
			/>
		);
	}
}

const mapStateToProps = state => ({
	showServerDropdown: state.rooms.showServerDropdown,
	showSortDropdown: state.rooms.showSortDropdown,
	showSearchHeader: state.rooms.showSearchHeader,
	connecting: state.meteor.connecting || state.server.loading,
	isFetching: state.rooms.isFetching,
	serverName: state.settings.Site_Name
});

const mapDispatchtoProps = dispatch => ({
	close: () => dispatch(closeServerDropdown()),
	open: () => dispatch(toggleServerDropdown()),
	closeSort: () => dispatch(closeSortDropdown()),
	setSearch: searchText => dispatch(setSearchAction(searchText))
});

export default connect(mapStateToProps, mapDispatchtoProps)(RoomsListHeaderView);
