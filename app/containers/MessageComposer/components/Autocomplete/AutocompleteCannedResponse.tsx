import { View, Text } from 'react-native';
import { PlainText } from '~/containers/PlainText';

import sharedStyles from '~/views/Styles';
import { type IAutocompleteCannedResponse } from '~/containers/MessageComposer/interfaces';
import I18n from '~/i18n';
import { CustomIcon } from '~/containers/CustomIcon';
import { NO_CANNED_RESPONSES } from '~/containers/MessageComposer/constants';
import { useStyle } from './styles';

export const AutocompleteCannedResponse = ({ item }: { item: IAutocompleteCannedResponse }) => {
	const [styles] = useStyle();
	if (item.id === NO_CANNED_RESPONSES) {
		return (
			<View style={styles.canned}>
				<View style={styles.cannedTitle}>
					<Text style={styles.cannedTitleText}>
						{I18n.t('No_match_found')} <Text style={sharedStyles.textSemibold}>{I18n.t('Check_canned_responses')}</Text>
					</Text>
					<CustomIcon name='chevron-right' size={24} />
				</View>
			</View>
		);
	}
	return (
		<View style={styles.canned}>
			<View style={styles.cannedTitle}>
				<PlainText style={styles.cannedTitleText} numberOfLines={1}>
					{item.title}
				</PlainText>
			</View>
			{item.subtitle ? (
				<View style={styles.cannedSubtitle}>
					<PlainText style={styles.cannedSubtitleText}>{item.subtitle}</PlainText>
				</View>
			) : null}
		</View>
	);
};
