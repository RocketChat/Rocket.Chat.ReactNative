import { Text } from 'react-native';

import I18n from '../../../../i18n';
import styles from '../../styles';
import { useTheme } from '../../../../theme';
import ContentWrapper from './ContentWrapper';

const EncryptedContent = () => {
	'use memo';

	const { colors } = useTheme();

	return (
		<ContentWrapper>
			<Text
				style={[styles.textInfo, { color: colors.fontSecondaryInfo }]}
				accessibilityLabel={I18n.t('Encrypted_message')}
				testID='message-encrypted'>
				{I18n.t('Encrypted_message')}
			</Text>
		</ContentWrapper>
	);
};

export default EncryptedContent;
