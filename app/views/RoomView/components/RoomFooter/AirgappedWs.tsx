import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import I18n from '../../../../i18n';
import { useTheme } from '../../../../theme';
import styles from './styles';

export const AirgappedWs = () => {
	'use memo';

	const { colors } = useTheme();
	const { bottom } = useSafeAreaInsets();

	return (
		<View style={[styles.readOnly, { paddingBottom: bottom }]}>
			<Text style={[styles.previewMode, { color: colors.fontDefault }]}>{I18n.t('AirGapped_workspace_read_only_title')}</Text>
			<Text style={[styles.readOnlyDescription, { color: colors.fontDefault }]}>
				{I18n.t('AirGapped_workspace_read_only_description')}
			</Text>
		</View>
	);
};
