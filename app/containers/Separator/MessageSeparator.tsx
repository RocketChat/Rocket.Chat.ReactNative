import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import sharedStyles from '~/views/Styles';
import { useTheme } from '~/theme';
import DateSeparator, { DateSeparatorLabel } from './DateSeparator';
import { separatorStyles } from './styles';

const styles = StyleSheet.create({
	text: {
		fontSize: 12,
		lineHeight: 16,
		marginLeft: 8,
		...sharedStyles.textBold
	},
	dateLabel: {
		marginHorizontal: 12
	}
});

const UnreadSeparator = ({ ts }: { ts?: Date | string | null }): ReactElement => {
	const { colors } = useTheme();
	const lineStyle = { backgroundColor: colors.strokeError };

	return (
		<View style={separatorStyles.container}>
			<View style={[separatorStyles.line, lineStyle]} />
			{ts ? (
				<>
					<View style={styles.dateLabel}>
						<DateSeparatorLabel ts={ts} />
					</View>
					<View style={[separatorStyles.line, lineStyle]} />
				</>
			) : null}
			<Text style={[styles.text, { color: colors.fontDanger }]}>{I18n.t('unread_messages')}</Text>
		</View>
	);
};

const MessageSeparator = ({ ts, unread }: { ts?: Date | string | null; unread?: boolean }): ReactElement | null => {
	if (!ts && !unread) {
		return null;
	}

	if (unread) {
		return <UnreadSeparator ts={ts} />;
	}

	return <DateSeparator ts={ts!} />;
};

export default MessageSeparator;
