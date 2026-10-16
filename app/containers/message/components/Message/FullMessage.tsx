import { View } from 'react-native';

import styles from '~/containers/message/styles';
import markdownStyles from '~/containers/markdown/styles';
import TextLineCenter from '~/containers/TextLineCenter';
import MessageAvatar from '../MessageAvatar';
import MessageAccessibleIndex from '../MessageAccessibleIndex';
import RightIcons from '../RightIcons';
import { Layout } from '../Layout';
import { useMessageField, useMessageGrouping } from '~/containers/message/stores/MessageStore';

const FullMessage = ({ isPreview }: { isPreview?: boolean }) => {
	const isHeader = useMessageGrouping();
	const id = useMessageField(item => item.id);

	return (
		<View testID={`message-${id}`} style={styles.container}>
			<MessageAccessibleIndex>
				<View style={styles.flex}>
					<MessageAvatar />
					<View style={styles.messageContent}>
						<Layout isPreview={isPreview} isHeader={isHeader} />
					</View>
					{!isHeader ? (
						<TextLineCenter lineHeight={markdownStyles.text.lineHeight}>
							<RightIcons />
						</TextLineCenter>
					) : null}
				</View>
			</MessageAccessibleIndex>
		</View>
	);
};

export default FullMessage;
