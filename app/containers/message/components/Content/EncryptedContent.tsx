import { PlainText } from 'react-native-plain-text';

import I18n from '~/i18n';
import styles from '~/containers/message/styles';
import { useTheme } from '~/theme';
import ContentWrapper from './ContentWrapper';

const EncryptedContent = () => {
	const { colors } = useTheme();

	return (
		<ContentWrapper>
			<PlainText
				style={[styles.textInfo, { color: colors.fontSecondaryInfo }]}
				accessibilityLabel={I18n.t('Encrypted_message')}
				testID='message-encrypted'>
				{I18n.t('Encrypted_message')}
			</PlainText>
		</ContentWrapper>
	);
};

export default EncryptedContent;
