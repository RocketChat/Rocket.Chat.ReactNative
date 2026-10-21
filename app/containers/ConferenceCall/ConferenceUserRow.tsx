import { type ReactElement, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Avatar from '~/containers/Avatar';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';

interface IConferenceUserRow {
	userId: string;
	name?: string;
	username: string;
	leading?: ReactElement | null;
	status?: string;
	children?: ReactNode;
	testID?: string;
}

const AVATAR_SIZE = 28;

const styles = StyleSheet.create({
	row: {
		minHeight: 48,
		paddingHorizontal: 24,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12
	},
	text: {
		flex: 1
	},
	names: {
		...sharedStyles.textRegular,
		fontSize: 14,
		lineHeight: 20
	},
	status: {
		...sharedStyles.textRegular,
		fontSize: 12,
		lineHeight: 16
	},
	username: {
		...sharedStyles.textRegular
	}
});

const ConferenceUserRow = ({ userId, name, username, leading, status, children, testID }: IConferenceUserRow): ReactElement => {
	const { colors } = useTheme();

	return (
		<View style={styles.row} testID={testID}>
			<Avatar avatar={`/avatar/uid/${userId}`} text={username} size={AVATAR_SIZE} borderRadius={4} />
			{leading}
			<View style={styles.text}>
				<Text style={[styles.names, { color: colors.fontTitlesLabels }]} numberOfLines={1}>
					{name} <Text style={[styles.username, { color: colors.fontHint }]}>{username}</Text>
				</Text>
				{status ? <Text style={[styles.status, { color: colors.fontHint }]}>{status}</Text> : null}
			</View>
			{children}
		</View>
	);
};

export default ConferenceUserRow;
