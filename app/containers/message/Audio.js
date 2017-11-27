import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import { connect } from 'react-redux';

@connect(state => ({
	server: state.server.server
}))
export default class Audio extends React.PureComponent {
	static propTypes = {
		file: PropTypes.object.isRequired,
		server: PropTypes.string.isRequired
	}

	render() {
		const { file, server } = this.props;

		return (
			<Text onPress={() => alert('aisudhasiudh')}>{`${ server }${ JSON.parse(JSON.stringify(file.audio_url)) }`}</Text>
		);
	}
}
