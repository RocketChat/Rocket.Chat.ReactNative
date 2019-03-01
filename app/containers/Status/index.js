import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ViewPropTypes } from 'react-native';

import Status from './Status';

@connect((state, ownProps) => {
	if (state.login.user && ownProps.id === state.login.user.id) {
		return {
			status: state.login.user && state.login.user.status,
			offline: !state.meteor.connected
		};
	}

	const user = state.activeUsers[ownProps.id];
	return {
		status: (user && user.status) || 'offline'
	};
})

export default class StatusContainer extends React.PureComponent {
	static propTypes = {
		// id is a prop, but it's used only inside @connect to find for current status
		id: PropTypes.string, // eslint-disable-line
		style: ViewPropTypes.style,
		size: PropTypes.number,
		status: PropTypes.string,
		offline: PropTypes.bool
	};

	static defaultProps = {
		size: 16
	}

	get status() {
		const { offline, status } = this.props;
		if (offline) {
			return 'offline';
		}
		return status;
	}

	render() {
		const { style, size } = this.props;
		return <Status size={size} style={style} status={this.status} />;
	}
}
