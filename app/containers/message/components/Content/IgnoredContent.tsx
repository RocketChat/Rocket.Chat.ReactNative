import { PlainText } from '~/containers/PlainText';

import I18n from '~/i18n';
import styles from '~/containers/message/styles';
import { useTheme } from '~/theme';
import { useMessageText } from '~/containers/message/stores/MessageStore';
import ContentWrapper from './ContentWrapper';

const IgnoredContent = () => {
	const { colors } = useTheme();
	const { messageText } = useMessageText();

	return (
		<ContentWrapper>
			<PlainText style={[styles.textInfo, { color: colors.fontSecondaryInfo }]} testID={`message-ignored-${messageText}`}>
				{I18n.t('Message_Ignored')}
			</PlainText>
		</ContentWrapper>
	);
};

export default IgnoredContent;
