import { Text } from 'react-native';

import styles from '../../styles';
import { getInfoMessage, messageHaveAuthorName } from '../../utils';
import { useTheme } from '../../../../theme';
import { themes } from '../../../../lib/constants/colors';
import { type MessageTypesValues } from '../../../../definitions';
import { useInfoData, useMessageAuthor, useMessageText } from '../../stores/MessageStore';
import User from '../User';

const InfoContent = () => {
	'use memo';

	const { theme } = useTheme();
	const { t: type, comment } = useInfoData();
	const { u: author, role } = useMessageAuthor();
	const { messageText } = useMessageText();

	const infoMessage = getInfoMessage({ type, role, msg: messageText, author, comment });

	const renderMessageContent = (
		<Text style={[styles.textInfo, { color: themes[theme].fontSecondaryInfo }]} accessibilityLabel={infoMessage}>
			{infoMessage}
		</Text>
	);

	if (messageHaveAuthorName(type as MessageTypesValues)) {
		return (
			<Text>
				<User /> {renderMessageContent}
			</Text>
		);
	}

	return renderMessageContent;
};

InfoContent.displayName = 'MessageInfoContent';

export default InfoContent;
