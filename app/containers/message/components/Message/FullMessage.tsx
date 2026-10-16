import { View } from 'react-native';

import styles from '~/containers/message/styles';
import markdownStyles from '~/containers/markdown/styles';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';
import MessageAvatar from '../MessageAvatar';
import MessageAccessibleIndex from '../MessageAccessibleIndex';
import RightIcons from '../RightIcons';
import { Layout } from '../Layout';
import { useMessageField, useMessageGrouping } from '~/containers/message/stores/MessageStore';

const FullMessage = ({ isPreview }: { isPreview?: boolean }) => {
	const isHeader = useMessageGrouping();
	const id = useMessageField(item => item.id);
	const { fontScale } = useResponsiveLayout();

	return (
		<View testID={`message-${id}`} style={styles.container}>
			<MessageAccessibleIndex>
				<View style={styles.flex}>
					<MessageAvatar />
					<View style={styles.messageContent}>
						<Layout isPreview={isPreview} isHeader={isHeader} />
					</View>
					{!isHeader ? (
						<View style={[styles.rightIconsLine, { height: markdownStyles.text.lineHeight * fontScale }]}>
							<RightIcons />
						</View>
					) : null}
				</View>
			</MessageAccessibleIndex>
		</View>
	);
};

export default FullMessage;
