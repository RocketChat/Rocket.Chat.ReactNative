import { StyleSheet, View, Text } from 'react-native';
import PropTypes from 'prop-types';
import React from 'react';

import { connect } from 'react-redux';
import { strings } from '../i18n/translations';

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
	render() {
		const { connecting, authenticating, offline } = this.props;

		if (offline) {
			return (
				<View style={[styles.bannerContainer, { backgroundColor: 'red' }]}>
					<Text style={[styles.bannerText, { color: '#a00' }]}>{strings.offline}</Text>
				</View>
			);
		}
		if (connecting) {
			return (
				<View style={[styles.bannerContainer, { backgroundColor: '#0d0' }]}>
					<Text style={[styles.bannerText, { color: '#fff' }]}>{strings.connecting}</Text>
				</View>
			);
		}

		if (authenticating) {
			return (
				<View style={[styles.bannerContainer, { backgroundColor: 'orange' }]}>
					<Text style={[styles.bannerText, { color: '#a00' }]}>{strings.authenticating}</Text>
				</View>
			);
		}

		return null;
	}
}
