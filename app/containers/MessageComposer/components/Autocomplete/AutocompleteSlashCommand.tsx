import { View, Text } from 'react-native';

import { type IAutocompleteSlashCommand } from '../../interfaces';
import I18n from '../../../../i18n';
import { translateKey } from '../../../UIKit/translate';
import { useStyle } from './styles';

export const AutocompleteSlashCommand = ({ item }: { item: IAutocompleteSlashCommand }) => {
	const [styles] = useStyle();
	const subtitle = item.subtitle
		? (translateKey(item.subtitle, item.appId) ?? (I18n.isTranslated(item.subtitle) ? I18n.t(item.subtitle) : item.subtitle))
		: undefined;
	return (
		<View style={styles.slashItem}>
			<View style={styles.slashTitle}>
				<Text style={styles.slashTitleText} numberOfLines={1}>
					/{item.title}
				</Text>
			</View>
			{subtitle ? (
				<View style={styles.slashSubtitle}>
					<Text style={styles.slashSubtitleText}>{subtitle}</Text>
				</View>
			) : null}
		</View>
	);
};
