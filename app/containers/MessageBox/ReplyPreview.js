import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import moment from 'moment';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Markdown from '../message/Markdown';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row'
	},
	messageContainer: {
		flex: 1,
		marginHorizontal: 15,
		backgroundColor: '#F3F4F5',
		paddingHorizontal: 15,
		paddingVertical: 10,
		borderRadius: 2
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
		marginRight: 15
	}
});

@connect(state => ({
	Message_TimeFormat: state.settings.Message_TimeFormat
}))
export default class ReplyPreview extends Component {
	static propTypes = {
		message: PropTypes.object.isRequired,
		Message_TimeFormat: PropTypes.string.isRequired,
		close: PropTypes.func.isRequired
	}

	close = () => {
		this.props.close();
	}

	render() {
		const { message, Message_TimeFormat } = this.props;
		const time = moment(message.ts).format(Message_TimeFormat);
		return (
			<View style={styles.container}>
				<View style={styles.messageContainer}>
					<View style={styles.header}>
						<Text style={styles.username}>{message.u.username}</Text>
						<Text style={styles.time}>{time}</Text>
					</View>
					<Markdown msg={message.msg} />
				</View>
				<Icon name='close' size={20} style={styles.close} onPress={this.close} />
			</View>
		);
	}
}
