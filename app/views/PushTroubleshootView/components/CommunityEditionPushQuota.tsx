import React from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import * as List from '../../../containers/List';
import i18n from '../../../i18n';
import { useAppSelector } from '../../../lib/hooks';
import { useTheme } from '../../../theme';
import sharedStyles from '../../Styles';

const WARNING_MINIMUM_VALUE = 70;
const WARNING_MAXIMUM_VALUE = 90;

export default function CommunityEditionPushQuota(): React.ReactElement | null {
	const { colors } = useTheme();
	const { consumptionPercentage, isCommunityEdition } = useAppSelector(state => ({
		isCommunityEdition: state.troubleshootingNotification.isCommunityEdition,
		consumptionPercentage: state.troubleshootingNotification.consumptionPercentage
	}));

	if (!isCommunityEdition) return null;

	const percentage = `${Math.floor(consumptionPercentage)}%`;

	let percentageColor = colors.statusFontSuccess;
	if (consumptionPercentage > WARNING_MINIMUM_VALUE && consumptionPercentage < WARNING_MAXIMUM_VALUE) {
		percentageColor = colors.statusFontWarning;
	}
	if (consumptionPercentage >= WARNING_MAXIMUM_VALUE) {
		percentageColor = colors.statusFontDanger;
	}

	const alertWorkspaceConsumption = () => {
		Alert.alert(i18n.t('Push_consumption_alert_title'), i18n.t('Push_consumption_alert_description'));
	};

	return (
		<List.Section title='Community_edition_push_quota'>
			<List.Separator />
			<List.Item
				title='Workspace_consumption'
				testID='push-troubleshoot-view-workspace-consumption'
				onPress={alertWorkspaceConsumption}
				right={() => <Text style={[styles.pickerText, { color: percentageColor }]}>{percentage}</Text>}
				additionalAcessibilityLabel={percentage}
			/>
			<List.Separator />
			<List.Info info='Workspace_consumption_description' />
		</List.Section>
	);
}

const styles = StyleSheet.create({
	pickerText: {
		...sharedStyles.textRegular,
		fontSize: 16
	}
});
