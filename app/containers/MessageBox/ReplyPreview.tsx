import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import moment from 'moment';
import { connect } from 'react-redux';

import { MarkdownPreview } from '../markdown';
import { CustomIcon } from '../../lib/Icons';
import sharedStyles from '../../views/Styles';
import { themes } from '../../constants/colors';
import { IMessage } from '../../definitions/IMessage';

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
		lineHeight: 16,
		marginLeft: 6,
		...sharedStyles.textRegular,
		fontWeight: '300'
	},
	close: {
		marginRight: 10
	}
});

interface IMessageBoxReplyPreview {
	replying: boolean;
	message: IMessage;
	Message_TimeFormat: string;
	close(): void;
	baseUrl: string;
	username: string;
	getCustomEmoji: Function;
	theme: string;
	useRealName: boolean;
}

const ReplyPreview = React.memo(
	({ message, Message_TimeFormat, replying, close, theme, useRealName }: IMessageBoxReplyPreview) => {
		if (!replying) {
			return null;
		}

		const time = moment(message.ts).format(Message_TimeFormat);
		return (
			<View style={[styles.container, { backgroundColor: themes[theme].messageboxBackground }]}>
				<View style={[styles.messageContainer, { backgroundColor: themes[theme].chatComponentBackground }]}>
					<View style={styles.header}>
						<Text style={[styles.username, { color: themes[theme].tintColor }]}>
							{useRealName ? message.u?.name : message.u?.username}
						</Text>
						<Text style={[styles.time, { color: themes[theme].auxiliaryText }]}>{time}</Text>
					</View>
					<MarkdownPreview msg={message.msg} />
				</View>
				<CustomIcon name='close' color={themes[theme].auxiliaryText} size={20} style={styles.close} onPress={close} />
			</View>
		);
	},
	(prevProps: any, nextProps: any) =>
		prevProps.replying === nextProps.replying &&
		prevProps.theme === nextProps.theme &&
		prevProps.message.id === nextProps.message.id
);

const mapStateToProps = (state: any) => ({
	Message_TimeFormat: state.settings.Message_TimeFormat,
	baseUrl: state.server.server,
	useRealName: state.settings.UI_Use_Real_Name
});

export default connect(mapStateToProps)(ReplyPreview);
