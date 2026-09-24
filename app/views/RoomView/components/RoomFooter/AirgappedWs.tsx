import { View } from 'react-native';
import { PlainText } from 'react-native-plain-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import I18n from '~/i18n';
import { useTheme } from '~/theme';
import styles from './styles';

export const AirgappedWs = () => {
	const { colors } = useTheme();
	const { bottom } = useSafeAreaInsets();

	return (
		<View style={[styles.readOnly, { paddingBottom: bottom }]}>
			<PlainText style={[styles.previewMode, { color: colors.fontDefault }]}>
				{I18n.t('AirGapped_workspace_read_only_title')}
			</PlainText>
			<PlainText style={[styles.readOnlyDescription, { color: colors.fontDefault }]}>
				{I18n.t('AirGapped_workspace_read_only_description')}
			</PlainText>
		</View>
	);
};
