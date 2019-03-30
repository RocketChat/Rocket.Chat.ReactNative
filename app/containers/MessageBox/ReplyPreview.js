import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import moment from 'moment';
import { connect } from 'react-redux';
import FastImage from 'react-native-fast-image';
import { RectButton } from 'react-native-gesture-handler';

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
		lineHeight: 20,
		marginLeft: 6,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular,
		fontWeight: '300'
	},
	close: {
		marginRight: 10
	},
	thumbnail: {
		marginLeft: 'auto',
		width: 50,
		height: 50,
		borderRadius: 2
	},
	text: {
		flex: 1,
		flexDirection: 'column'
	},
	details: {
		flexDirection: 'row'
	},
	buttonVideo: {
		borderRadius: 4,
		height: 50,
		width: 100,
		backgroundColor: '#1f2329',
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 'auto'
	},
	buttonAudio: {
		borderRadius: 50,
		height: 50,
		width: 50,
		backgroundColor: '#f7f8fa',
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 'auto'
	},
	playVideo: {
		color: '#f7f8fa'
	},
	playAudio: {
		color: '#1D74F5'
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
		user: PropTypes.object.isRequired
	}

	shouldComponentUpdate() {
		return false;
	}

	close = () => {
		const { close } = this.props;
		close();
	}

	renderAttachment = () => {
		const {
			message, baseUrl, user
		} = this.props;

		if (!message.attachments) {
			return null;
		} else {
			const attach = [];
			Object.keys(message.attachments).forEach((key) => {
				if (message.attachments[key].image_url) {
					const img = `${ baseUrl }${ message.attachments[key].image_url }?rc_uid=${ user.id }&rc_token=${ user.token }`;
					attach.push(
						<FastImage
							source={{ uri: encodeURI(img) }}
							resizeMode={FastImage.resizeMode.cover}
							style={styles.thumbnail}
						/>
					);
				} else if (message.attachments[key].video_url) {
					attach.push(
						<RectButton
							style={styles.buttonVideo}
							activeOpacity={0.5}
							underlayColor='#fff'
						>
							<CustomIcon
								name='play'
								size={20}
								style={styles.playVideo}
							/>
						</RectButton>
					);
				} else if (message.attachments[key].audio_url) {
					attach.push(
						<RectButton
							style={styles.buttonAudio}
							activeOpacity={0.5}
							underlayColor='#fff'
						>
							<CustomIcon
								name='Files-audio'
								size={20}
								style={styles.playAudio}
							/>
						</RectButton>
					);
				}
			});
			return attach;
		}
	};

	render() {
		const {
			message, Message_TimeFormat, customEmojis, baseUrl, user
		} = this.props;
		const time = moment(message.ts).format(Message_TimeFormat);
		return (
			<View style={styles.container}>
				<View style={styles.messageContainer}>
					<View style={styles.header}>
						<View style={styles.text}>
							<View style={styles.details}>
								<Text style={styles.username}>{message.u.username}</Text>
								<Text style={styles.time}>{time}</Text>
							</View>
							<Markdown msg={message.msg} customEmojis={customEmojis} baseUrl={baseUrl} username={user.username} />
						</View>
						{this.renderAttachment()}
					</View>
				</View>
				<CustomIcon name='cross' color={COLOR_TEXT_DESCRIPTION} size={20} style={styles.close} onPress={this.close} />
			</View>
		);
	}
}
