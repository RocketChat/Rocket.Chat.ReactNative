import React, { useContext } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import moment from 'moment';

import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import MessageError from './MessageError';
import sharedStyles from '../../views/Styles';
import messageStyles from './styles';
import MessageContext from './Context';
import { SYSTEM_MESSAGE_TYPES_WITH_AUTHOR_NAME } from './utils';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	username: {
		fontSize: 16,
		lineHeight: 22,
		...sharedStyles.textMedium
	},
	usernameInfoMessage: {
		fontSize: 16,
		...sharedStyles.textMedium
	},
	titleContainer: {
		flexShrink: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	alias: {
		fontSize: 14,
		...sharedStyles.textRegular
	}
});

interface IMessageUser {
	isHeader?: boolean;
	hasError?: boolean;
	useRealName: boolean;
	author?: {
		_id: string;
		name?: string;
		username?: string;
	};
	alias?: string;
	ts?: Date;
	timeFormat?: string;
	theme: string;
	navToRoomInfo: Function;
	type: string;
}

const User = React.memo(
	({ isHeader, useRealName, author, alias, ts, timeFormat, hasError, theme, navToRoomInfo, type, ...props }: IMessageUser) => {
		if (isHeader || hasError) {
			const navParam = {
				t: 'd',
				rid: author!._id
			};
			const { user } = useContext(MessageContext);
			const username = (useRealName && author!.name) || author!.username;
			const aliasUsername = alias ? (
				<Text style={[styles.alias, { color: themes[theme].auxiliaryText }]}> @{username}</Text>
			) : null;
			const time = moment(ts).format(timeFormat);
			const onUserPress = () => navToRoomInfo(navParam);
			const isDisabled = author!._id === user.id;

			const textContent = (
				<>
					{alias || username}
					{aliasUsername}
				</>
			);

			if (SYSTEM_MESSAGE_TYPES_WITH_AUTHOR_NAME.includes(type)) {
				return (
					<Text
						style={[styles.usernameInfoMessage, { color: themes[theme].titleText }]}
						onPress={onUserPress}
						// @ts-ignore
						disabled={isDisabled}>
						{textContent}
					</Text>
				);
			}

			return (
				<View style={styles.container}>
					<TouchableOpacity style={styles.titleContainer} onPress={onUserPress} disabled={isDisabled}>
						<Text style={[styles.username, { color: themes[theme].titleText }]} numberOfLines={1}>
							{textContent}
						</Text>
					</TouchableOpacity>
					<Text style={[messageStyles.time, { color: themes[theme].auxiliaryText }]}>{time}</Text>
					{hasError && <MessageError hasError={hasError} theme={theme} {...props} />}
				</View>
			);
		}
		return null;
	}
);

User.displayName = 'MessageUser';

export default withTheme(User);
