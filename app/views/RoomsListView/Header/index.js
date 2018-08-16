import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { toggleServerDropdown, closeServerDropdown } from '../../../actions/rooms';
import Header from './Header';

@connect(state => ({
	showServerDropdown: state.rooms.showServerDropdown,
	serverName: state.settings.Site_Name
}), dispatch => ({
	close: () => dispatch(closeServerDropdown()),
	open: () => dispatch(toggleServerDropdown())
}))
export default class RoomsListHeaderView extends Component {
	static propTypes = {
		showServerDropdown: PropTypes.bool,
		serverName: PropTypes.string,
		open: PropTypes.func,
		close: PropTypes.func
	}

	onPress = () => {
		const { showServerDropdown, close, open } = this.props;
		if (showServerDropdown) {
			close();
		} else {
			open();
		}
	}

	render() {
		const { serverName, showServerDropdown } = this.props;
		return <Header onPress={this.onPress} serverName={serverName} showServerDropdown={showServerDropdown} />;
	}
}
