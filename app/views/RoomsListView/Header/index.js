import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import {
	toggleServerDropdown, closeServerDropdown, closeSortDropdown, setSearch as setSearchAction
} from '../../../actions/rooms';
import Header from './Header';
import { withTheme } from '../../../theme';
import EventEmitter from '../../../utils/events';
import { KEY_COMMAND, handleCommandOpenServerDropdown } from '../../../commands';
import { isTablet } from '../../../utils/deviceInfo';

class RoomsListHeaderView extends PureComponent {
	static propTypes = {
		showServerDropdown: PropTypes.bool,
		showSortDropdown: PropTypes.bool,
		showSearchHeader: PropTypes.bool,
		serverName: PropTypes.string,
		connecting: PropTypes.bool,
		isFetching: PropTypes.bool,
		theme: PropTypes.string,
		open: PropTypes.func,
		close: PropTypes.func,
		closeSort: PropTypes.func,
		setSearch: PropTypes.func
	}

	componentDidMount() {
		if (isTablet) {
			EventEmitter.addEventListener(KEY_COMMAND, this.handleCommands);
		}
	}

	componentWillUnmount() {
		if (isTablet) {
			EventEmitter.removeListener(KEY_COMMAND, this.handleCommands);
		}
	}

	// eslint-disable-next-line react/sort-comp
	handleCommands = ({ event }) => {
		if (handleCommandOpenServerDropdown(event)) {
			this.onPress();
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

	render() {
		const {
			serverName, showServerDropdown, showSearchHeader, connecting, isFetching, theme
		} = this.props;

		return (
			<Header
				theme={theme}
				serverName={serverName}
				showServerDropdown={showServerDropdown}
				showSearchHeader={showSearchHeader}
				connecting={connecting}
				isFetching={isFetching}
				onPress={this.onPress}
				onSearchChangeText={this.onSearchChangeText}
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

export default connect(mapStateToProps, mapDispatchtoProps)(withTheme(RoomsListHeaderView));
