import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import ConferenceControlButton, { COMPACT_BUTTON_SIZE } from './ConferenceControlButton';

interface IConferenceSheetHeader {
	title: string;
	onClose: () => void;
	actions?: ReactElement | null;
}

const styles = StyleSheet.create({
	header: {
		paddingHorizontal: 24,
		paddingVertical: 12,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	title: {
		...sharedStyles.textBold,
		fontSize: 16,
		lineHeight: 24
	},
	actions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8
	}
});

const ConferenceSheetHeader = ({ title, onClose, actions }: IConferenceSheetHeader): ReactElement => {
	const { colors } = useTheme();

	return (
		<View style={styles.header}>
			<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>{title}</Text>
			<View style={styles.actions}>
				{actions}
				<ConferenceControlButton icon='close' label={I18n.t('Close')} size={COMPACT_BUTTON_SIZE} onPress={onClose} />
			</View>
		</View>
	);
};

export default ConferenceSheetHeader;
