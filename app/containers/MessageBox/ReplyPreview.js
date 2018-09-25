import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import moment from 'moment';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Markdown from '../message/Markdown';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		marginTop: 10,
		backgroundColor: '#fff'
	},
	messageContainer: {
		flex: 1,
		marginHorizontal: 10,
		backgroundColor: '#F3F4F5',
		paddingHorizontal: 15,
		paddingVertical: 10,
		borderRadius: 4
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	username: {
		color: '#1D74F5',
		fontSize: 16,
		fontWeight: '500'
	},
	time: {
		color: '#9EA2A8',
		fontSize: 12,
		lineHeight: 16,
		marginLeft: 5
	},
	close: {
		marginRight: 10
	}
});

@connect(state => ({
	Message_TimeFormat: state.settings.Message_TimeFormat,
	customEmojis: state.customEmojis,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
}))
export default class ReplyPreview extends Component {
	static propTypes = {
		message: PropTypes.object.isRequired,
		Message_TimeFormat: PropTypes.string.isRequired,
		close: PropTypes.func.isRequired,
		customEmojis: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired,
		username: PropTypes.string.isRequired
	}

	close = () => {
		const { close } = this.props;
		close();
	}

	render() {
		const {
			message, Message_TimeFormat, customEmojis, baseUrl, username
		} = this.props;
		const time = moment(message.ts).format(Message_TimeFormat);
		return (
			<View style={styles.container}>
				<View style={styles.messageContainer}>
					<View style={styles.header}>
						<Text style={styles.username}>{message.u.username}</Text>
						<Text style={styles.time}>{time}</Text>
					</View>
					<Markdown msg={message.msg} customEmojis={customEmojis} baseUrl={baseUrl} username={username} />
				</View>
				<Icon name='close' color='#9ea2a8' size={20} style={styles.close} onPress={this.close} />
			</View>
		);
	}
}
