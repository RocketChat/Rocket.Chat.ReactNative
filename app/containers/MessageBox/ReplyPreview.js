import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import moment from 'moment';
import { connect } from 'react-redux';

import Markdown from '../message/Markdown';
import { CustomIcon } from '../../lib/Icons';
import sharedStyles from '../../views/Styles';
import {
	COLOR_PRIMARY, COLOR_BACKGROUND_CONTAINER, COLOR_TEXT_DESCRIPTION, COLOR_WHITE
} from '../../constants/colors';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		marginTop: 10,
		backgroundColor: COLOR_WHITE
	},
	messageContainer: {
		flex: 1,
		marginHorizontal: 10,
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		paddingHorizontal: 15,
		paddingVertical: 10,
		borderRadius: 4
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	username: {
		color: COLOR_PRIMARY,
		fontSize: 16,
		...sharedStyles.textMedium
	},
	time: {
		fontSize: 12,
		lineHeight: 16,
		marginLeft: 6,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular,
		fontWeight: '300'
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

	shouldComponentUpdate() {
		return false;
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
				<CustomIcon name='cross' color={COLOR_TEXT_DESCRIPTION} size={20} style={styles.close} onPress={this.close} />
			</View>
		);
	}
}
