import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { toggleServerDropdown, closeServerDropdown, setSearch } from '../../../actions/rooms';
import EventEmitter from '../../../lib/methods/helpers/events';
import { KEY_COMMAND, handleCommandOpenServerDropdown, IKeyCommandEvent } from '../../../commands';
import { isTablet } from '../../../lib/methods/helpers';
import { events, logEvent } from '../../../lib/methods/helpers/log';
import Header from './Header';
import { IApplicationState } from '../../../definitions';

interface IRoomsListHeaderViewProps {
	showServerDropdown: boolean;
	showSearchHeader: boolean;
	serverName: string;
	connecting: boolean;
	connected: boolean;
	isFetching: boolean;
	server: string;
	dispatch: Dispatch;
}

class RoomsListHeaderView extends PureComponent<IRoomsListHeaderViewProps, any> {
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
	handleCommands = ({ event }: { event: IKeyCommandEvent }) => {
		if (handleCommandOpenServerDropdown(event)) {
			this.onPress();
		}
	};

	onSearchChangeText = (text: string) => {
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
		const { serverName, showServerDropdown, showSearchHeader, connecting, connected, isFetching, server } = this.props;

		return (
			<Header
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

const mapStateToProps = (state: IApplicationState) => ({
	showServerDropdown: state.rooms.showServerDropdown,
	showSearchHeader: state.rooms.showSearchHeader,
	connecting: state.meteor.connecting || state.server.loading,
	connected: state.meteor.connected,
	isFetching: state.rooms.isFetching,
	serverName: state.settings.Site_Name as string,
	server: state.server.server
});

export default connect(mapStateToProps)(RoomsListHeaderView);
