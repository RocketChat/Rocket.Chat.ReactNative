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
import { logEvent, events } from '../../../utils/log';

class RoomsListHeaderView extends PureComponent {
	static propTypes = {
		showServerDropdown: PropTypes.bool,
		showSortDropdown: PropTypes.bool,
		showSearchHeader: PropTypes.bool,
		serverName: PropTypes.string,
		connecting: PropTypes.bool,
		connected: PropTypes.bool,
		isFetching: PropTypes.bool,
		theme: PropTypes.string,
		server: PropTypes.string,
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
		logEvent(events.RL_TOGGLE_SERVER_DROPDOWN);
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
			serverName, showServerDropdown, showSearchHeader, connecting, connected, isFetching, theme, server
		} = this.props;

		return (
			<Header
				theme={theme}
				serverName={serverName}
				server={server}
				showServerDropdown={showServerDropdown}
				showSearchHeader={showSearchHeader}
				connecting={connecting}
				connected={connected}
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
	connected: state.meteor.connected,
	isFetching: state.rooms.isFetching,
	serverName: state.settings.Site_Name,
	server: state.server.server
});

const mapDispatchtoProps = dispatch => ({
	close: () => dispatch(closeServerDropdown()),
	open: () => dispatch(toggleServerDropdown()),
	closeSort: () => dispatch(closeSortDropdown()),
	setSearch: searchText => dispatch(setSearchAction(searchText))
});

export default connect(mapStateToProps, mapDispatchtoProps)(withTheme(RoomsListHeaderView));
