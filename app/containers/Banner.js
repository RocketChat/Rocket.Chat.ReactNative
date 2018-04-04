import { StyleSheet, View, Text } from 'react-native';
import PropTypes from 'prop-types';
import React from 'react';

import { connect } from 'react-redux';

const styles = StyleSheet.create({
	bannerContainer: {
		backgroundColor: '#ddd'
	},
	bannerText: {
		textAlign: 'center',
		margin: 5
	}
});

@connect(state => ({
	connecting: state.meteor.connecting,
	authenticating: state.login.isFetching,
	offline: !state.meteor.connected,
	logged: !!state.login.token
}))

export default class Banner extends React.PureComponent {
	static propTypes = {
		connecting: PropTypes.bool,
		authenticating: PropTypes.bool,
		offline: PropTypes.bool
	}
	render() {
		const {
			connecting, authenticating, offline, logged
		} = this.props;

		if (offline) {
			return (
				<View style={[styles.bannerContainer, { backgroundColor: 'red' }]}>
					<Text style={[styles.bannerText, { color: '#a00' }]}>offline...</Text>
				</View>
			);
		}

		if (connecting) {
			return (
				<View style={[styles.bannerContainer, { backgroundColor: '#0d0' }]}>
					<Text style={[styles.bannerText, { color: '#fff' }]}>Connecting...</Text>
				</View>
			);
		}

		if (authenticating) {
			return (
				<View style={[styles.bannerContainer, { backgroundColor: 'orange' }]}>
					<Text style={[styles.bannerText, { color: '#a00' }]}>Authenticating...</Text>
				</View>
			);
		}

		if (logged) {
			return this.props.children;
		}

		return (
			<View style={[styles.bannerContainer, { backgroundColor: 'orange' }]}>
				<Text style={[styles.bannerText, { color: '#a00' }]}>Not logged...</Text>
			</View>
		);
	}
}
