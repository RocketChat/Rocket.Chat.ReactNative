import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { setSearch } from '../../../actions/rooms';
import Header from './Header';
import { IApplicationState } from '../../../definitions';

interface IRoomsListHeaderViewProps {
	showSearchHeader: boolean;
	serverName: string;
	connecting: boolean;
	connected: boolean;
	isFetching: boolean;
	server: string;
	dispatch: Dispatch;
	width?: number;
	onPress?: () => void;
}

class RoomsListHeaderView extends PureComponent<IRoomsListHeaderViewProps, any> {
	onSearchChangeText = (text: string) => {
		const { dispatch } = this.props;
		dispatch(setSearch(text.trim()));
	};

	render() {
		const { serverName, showSearchHeader, connecting, connected, isFetching, server, width, onPress } = this.props;

		return (
			<Header
				serverName={serverName}
				server={server}
				showSearchHeader={showSearchHeader}
				connecting={connecting}
				connected={connected}
				isFetching={isFetching}
				onPress={onPress}
				onSearchChangeText={this.onSearchChangeText}
				width={width}
			/>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	showSearchHeader: state.rooms.showSearchHeader,
	connecting: state.meteor.connecting || state.server.loading,
	connected: state.meteor.connected,
	isFetching: state.rooms.isFetching,
	serverName: state.settings.Site_Name as string,
	server: state.server.server
});

export default connect(mapStateToProps)(RoomsListHeaderView);
