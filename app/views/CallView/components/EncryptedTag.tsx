import { Text, View } from 'react-native';

import I18n from '~/i18n';
import { CustomIcon } from '~/containers/CustomIcon';
import { useTheme } from '~/theme';
import { styles } from '../styles';

const EncryptedTag = () => {
	const { colors } = useTheme();

	const label = I18n.t('Encrypted');

	return (
		<View
			style={[styles.encryptedTag, { backgroundColor: colors.surfaceSelected }]}
			accessible
			accessibilityLabel={label}
			testID='call-view-encrypted-tag'>
			<CustomIcon name='encrypted' size={12} color={colors.fontSecondaryInfo} />
			<Text style={[styles.encryptedTagText, { color: colors.fontSecondaryInfo }]}>{label}</Text>
		</View>
	);
};

export default EncryptedTag;
