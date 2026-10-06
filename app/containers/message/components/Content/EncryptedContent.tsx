import { Text } from 'react-native';

import I18n from '~/i18n';
import styles from '~/containers/message/styles';
import { useTheme } from '~/theme';
import ContentWrapper from './ContentWrapper';

const EncryptedContent = () => {
	const { colors } = useTheme();

	return (
		<ContentWrapper>
			<Text
				style={[styles.textInfo, { color: colors.fontSecondaryInfo }]}
				accessibilityLabel={I18n.t('E2E_Key_Error')}
				testID='message-encrypted'>
				{I18n.t('E2E_Key_Error')}
			</Text>
		</ContentWrapper>
	);
};

export default EncryptedContent;
