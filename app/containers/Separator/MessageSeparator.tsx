import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import sharedStyles from '~/views/Styles';
import { useTheme } from '~/theme';
import DateSeparator from './DateSeparator';
import { separatorStyles } from './styles';

const styles = StyleSheet.create({
	text: {
		fontSize: 12,
		lineHeight: 16,
		marginLeft: 8,
		...sharedStyles.textBold
	}
});

const UnreadSeparator = (): ReactElement => {
	const { colors } = useTheme();

	return (
		<View style={separatorStyles.container}>
			<View style={[separatorStyles.line, { backgroundColor: colors.strokeError }]} />
			<Text style={[styles.text, { color: colors.fontDanger }]}>{I18n.t('unread_messages')}</Text>
		</View>
	);
};

const MessageSeparator = ({ ts, unread }: { ts?: Date | string | null; unread?: boolean }): ReactElement | null => {
	if (!ts && !unread) {
		return null;
	}

	return (
		<>
			{ts ? <DateSeparator ts={ts} /> : null}
			{unread ? <UnreadSeparator /> : null}
		</>
	);
};

export default MessageSeparator;
