import { StyleSheet, View, Text } from 'react-native';
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
	connecting: state.meteor && state.meteor.connecting,
	authenticating: state.login && state.login.isFetching
}))

export default class Banner extends React.PureComponent {
	render() {
		const { connecting, authenticating } = this.props;
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
