import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { StyleSheet, View, ViewPropTypes } from 'react-native';
import { STATUS_COLORS } from '../constants/colors';

const styles = StyleSheet.create({
	status: {
		borderRadius: 16,
		width: 16,
		height: 16
	}
});

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

export default class Status extends React.PureComponent {
	static propTypes = {
		style: ViewPropTypes.style,
		status: PropTypes.string,
		offline: PropTypes.bool
	};

	get status() {
		const { offline, status } = this.props;
		if (offline) {
			return 'offline';
		}
		return status;
	}

	render() {
		return (<View style={[styles.status, this.props.style, { backgroundColor: STATUS_COLORS[this.status] }]} />);
	}
}
