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

@connect(state => ({
	activeUsers: state.activeUsers,
	user: state.login.user,
	offline: !state.meteor.connected
}))

export default class Status extends React.Component {
	static propTypes = {
		style: ViewPropTypes.style,
		id: PropTypes.string,
		activeUsers: PropTypes.object,
		user: PropTypes.object,
		offline: PropTypes.bool
	};

	shouldComponentUpdate(nextProps) {
		const { id: userId, user } = this.props;
		if (user.id === userId) {
			if (nextProps.offline !== this.props.offline) {
				return true;
			}
			return (nextProps.user && nextProps.user.status !== user.status);
		}
		return (nextProps.activeUsers[userId] && nextProps.activeUsers[userId].status) !== this.status;
	}

	get status() {
		const { id: userId, user, offline } = this.props;
		if (user.id === userId) {
			if (offline) {
				return 'offline';
			}
			return user.status || 'offline';
		}
		return (this.props.activeUsers && this.props.activeUsers[userId] && this.props.activeUsers[userId].status) || 'offline';
	}

	render() {
		return (<View style={[styles.status, this.props.style, { backgroundColor: STATUS_COLORS[this.status] }]} />);
	}
}
