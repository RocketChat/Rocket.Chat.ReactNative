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
	activeUsers: state.activeUsers
}))

export default class Status extends React.Component {
	static propTypes = {
		style: ViewPropTypes.style,
		id: PropTypes.string,
		activeUsers: PropTypes.object
	};

	shouldComponentUpdate(nextProps) {
		const userId = this.props.id;
		return (nextProps.activeUsers[userId] && nextProps.activeUsers[userId].status) !== this.status;
	}

	get status() {
		const userId = this.props.id;
		return (this.props.activeUsers && this.props.activeUsers[userId] && this.props.activeUsers[userId].status) || 'offline';
	}

	render() {
		return (<View style={[styles.status, this.props.style, { backgroundColor: STATUS_COLORS[this.status] }]} />);
	}
}
