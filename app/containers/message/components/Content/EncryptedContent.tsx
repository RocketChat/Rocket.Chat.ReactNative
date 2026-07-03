import { Text } from 'react-native';

import I18n from '../../../../i18n';
import styles from '../../styles';
import { useTheme } from '../../../../theme';
import { themes } from '../../../../lib/constants/colors';
import ContentWrapper from './ContentWrapper';

const EncryptedContent = () => {
	'use memo';

	const { theme } = useTheme();

	return (
		<ContentWrapper>
			<Text
				style={[styles.textInfo, { color: themes[theme].fontSecondaryInfo }]}
				accessibilityLabel={I18n.t('Encrypted_message')}
				testID='message-encrypted'>
				{I18n.t('Encrypted_message')}
			</Text>
		</ContentWrapper>
	);
};

EncryptedContent.displayName = 'MessageEncryptedContent';

export default EncryptedContent;
