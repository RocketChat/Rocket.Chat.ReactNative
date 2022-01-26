import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { toggleServerDropdown, closeServerDropdown, setSearch } from '../../../actions/rooms';
import { withTheme } from '../../../theme';
import EventEmitter from '../../../utils/events';
import { KEY_COMMAND, handleCommandOpenServerDropdown } from '../../../commands';
import { isTablet } from '../../../utils/deviceInfo';
import { events, logEvent } from '../../../utils/log';
import Header from './Header';

class RoomsListHeaderView extends PureComponent {
	static propTypes = {
		showServerDropdown: PropTypes.bool,
		showSearchHeader: PropTypes.bool,
		serverName: PropTypes.string,
		connecting: PropTypes.bool,
		connected: PropTypes.bool,
		isFetching: PropTypes.bool,
		theme: PropTypes.string,
		server: PropTypes.string
	};

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
	};

	onSearchChangeText = text => {
		const { dispatch } = this.props;
		dispatch(setSearch(text.trim()));
	};

	onPress = () => {
		logEvent(events.RL_TOGGLE_SERVER_DROPDOWN);
		const { showServerDropdown, dispatch } = this.props;
		if (showServerDropdown) {
			dispatch(closeServerDropdown());
		} else {
			dispatch(toggleServerDropdown());
		}
	};

	render() {
		const { serverName, showServerDropdown, showSearchHeader, connecting, connected, isFetching, theme, server } = this.props;

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
	showSearchHeader: state.rooms.showSearchHeader,
	connecting: state.meteor.connecting || state.server.loading,
	connected: state.meteor.connected,
	isFetching: state.rooms.isFetching,
	serverName: state.settings.Site_Name,
	server: state.server.server
});

export default connect(mapStateToProps)(withTheme(RoomsListHeaderView));
