import { StyleSheet, View, Text } from 'react-native';
import PropTypes from 'prop-types';
import React from 'react';

import { connect } from 'react-redux';

const styles = StyleSheet.create({
	bannerContainer: {
		backgroundColor: '#ddd',
		position: 'absolute',
		top: '0%',
		zIndex: 10,
		width: '100%'
	},
	bannerText: {
		textAlign: 'center',
		margin: 5
	}
});

@connect(state => ({
	connecting: state.meteor.connecting,
	authenticating: state.login.isFetching,
	offline: !state.meteor.connected
}))

export default class Banner extends React.PureComponent {
	static propTypes = {
		connecting: PropTypes.bool,
		authenticating: PropTypes.bool,
		offline: PropTypes.bool
	}
	componentWillMount() {
		this.state = {
			slow: false
		};
		this.timer = setTimeout(() => this.setState({ slow: true }), 5000);
	}
	componentWillUnmount() {
		clearTimeout(this.timer);
	}
	render() {
		const { connecting, authenticating, offline } = this.props;

		if (!this.state.slow) {
			return null;
		}

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

		return null;
	}
}
