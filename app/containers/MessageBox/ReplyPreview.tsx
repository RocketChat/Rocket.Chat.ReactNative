import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import moment from 'moment';
import { connect } from 'react-redux';

import { MarkdownPreview } from '../markdown';
import { CustomIcon } from '../CustomIcon';
import sharedStyles from '../../views/Styles';
import { themes } from '../../lib/constants';
import { IMessage } from '../../definitions/IMessage';
import { useTheme } from '../../theme';
import { IApplicationState } from '../../definitions';

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
	close(): void;
	baseUrl: string;
	username: string;
	getCustomEmoji: Function;
	useRealName: boolean;
	timeFormat: string;
}

const ReplyPreview = React.memo(
	({ message, replying, close, useRealName, timeFormat }: IMessageBoxReplyPreview) => {
		const { theme } = useTheme();

		if (!replying) {
			return null;
		}
		const time = moment(message.ts).format(timeFormat);
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
	(prevProps: IMessageBoxReplyPreview, nextProps: IMessageBoxReplyPreview) =>
		prevProps.replying === nextProps.replying && prevProps.message.id === nextProps.message.id
);

const mapStateToProps = (state: IApplicationState) => ({
	baseUrl: state.server.server,
	useRealName: state.settings.UI_Use_Real_Name as boolean
});

export default connect(mapStateToProps)(ReplyPreview);
