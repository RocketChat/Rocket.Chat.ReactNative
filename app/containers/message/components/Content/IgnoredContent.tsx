import { Text } from 'react-native';

import I18n from '../../../../i18n';
import styles from '../../styles';
import { useTheme } from '../../../../theme';
import { useMessageText } from '../../stores/MessageStore';
import ContentWrapper from './ContentWrapper';

const IgnoredContent = () => {
	'use memo';

	const { colors } = useTheme();
	const { messageText } = useMessageText();

	return (
		<ContentWrapper>
			<Text style={[styles.textInfo, { color: colors.fontSecondaryInfo }]} testID={`message-ignored-${messageText}`}>
				{I18n.t('Message_Ignored')}
			</Text>
		</ContentWrapper>
	);
};

export default IgnoredContent;
