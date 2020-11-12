import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import moment from 'moment';
import { connect } from 'react-redux';
import isEqual from 'lodash/isEqual';
import Markdown from '../markdown';
import { CustomIcon } from '../../lib/Icons';
import sharedStyles from '../../views/Styles';
import { themes } from '../../constants/colors';
import Attachments from '../message/Attachments';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		paddingTop: 10
	},
	messageContainer: {
		flex: 1,
		marginHorizontal: 10,
		paddingHorizontal: 15,
		paddingVertical: 10,
		borderRadius: 4
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	username: {
		fontSize: 16,
		...sharedStyles.textMedium
	},
	time: {
		fontSize: 12,
		lineHeight: 20,
		marginLeft: 6,
		...sharedStyles.textRegular,
		fontWeight: '300'
	},
	close: {
		marginRight: 10
	},
	thumbnail: {
		marginLeft: 'auto',
		width: 38,
		height: 38
	},
	text: {
		flex: 1,
		flexDirection: 'column',
		paddingRight: 5
	},
	details: {
		flexDirection: 'row'
	},
	buttonVideo: {
		height: 38,
		width: 38,
		backgroundColor: '#1f2329',
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 'auto'
	},
	buttonAudio: {
		height: 38,
		width: 38,
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

const ReplyPreview = React.memo(({
	message, Message_TimeFormat, baseUrl, username, replying, getCustomEmoji, close, theme
}) => {
	if (!replying) {
		return null;
	}

	const time = moment(message.ts).format(Message_TimeFormat);
	const description = (message.msg === '') ? message.attachments[0].description : message.msg;
	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: themes[theme].messageboxBackground }
			]}
		>
			<View style={[styles.messageContainer, { backgroundColor: themes[theme].chatComponentBackground }]}>
				<View style={styles.header}>
					<Text style={[styles.username, { color: themes[theme].tintColor }]}>{message.u?.username}</Text>
					<Text style={[styles.time, { color: themes[theme].auxiliaryText }]}>{time}</Text>
				</View>
				<Markdown
					msg={description}
					baseUrl={baseUrl}
					username={username}
					getCustomEmoji={getCustomEmoji}
					numberOfLines={1}
					preview
					theme={theme}
				/>
			</View>
			<Attachments
				attachments={message.attachments}
				timeFormat={Message_TimeFormat}
				showAttachment
				getCustomEmoji={getCustomEmoji}
				theme={theme}
			/>
			<CustomIcon name='close' color={themes[theme].auxiliaryText} size={20} style={styles.close} onPress={close} />
		</View>
	);
}, (prevProps, nextProps) => prevProps.replying === nextProps.replying && prevProps.theme === nextProps.theme && isEqual(prevProps.message, nextProps.message));

ReplyPreview.propTypes = {
	replying: PropTypes.bool,
	message: PropTypes.object.isRequired,
	Message_TimeFormat: PropTypes.string.isRequired,
	close: PropTypes.func.isRequired,
	baseUrl: PropTypes.string.isRequired,
	username: PropTypes.string.isRequired,
	getCustomEmoji: PropTypes.func,
	theme: PropTypes.string
};

const mapStateToProps = state => ({
	Message_TimeFormat: state.settings.Message_TimeFormat,
	baseUrl: state.server.server
});

export default connect(mapStateToProps)(ReplyPreview);
