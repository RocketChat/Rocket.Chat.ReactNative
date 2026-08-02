import { View, type ViewStyle } from 'react-native';

import styles from '../../styles';
import RepliedThread from '../RepliedThread';
import MessageAvatar from '../MessageAvatar';
import MessageAccessibleIndex from '../MessageAccessibleIndex';
import Content from '../Content';
import Attachments from '../Attachments';
import { useContentData, useIsInfoMessage, useMessageGrouping, useThreadPosition } from '../../stores/MessageStore';

const CompactMessage = () => {
	'use memo';

	const isHeader = useMessageGrouping();
	const { isThreadReply } = useThreadPosition();
	const isInfo = useIsInfoMessage();
	const { t: type, attachments } = useContentData();

	const thread = isThreadReply ? <RepliedThread isHeader={isHeader} /> : null;
	const infoStyle: ViewStyle = isInfo ? { alignItems: 'center' } : {};

	return (
		<View style={[styles.container, { marginTop: 4 }]}>
			{thread}
			<View style={[styles.flex, infoStyle]}>
				<MessageAvatar small />
				<MessageAccessibleIndex style={{ flex: 1 }}>
					<View style={styles.messageContent}>
						<Content />
						{isInfo && type === 'message_pinned' ? (
							<View pointerEvents='none'>
								<Attachments attachments={attachments} />
							</View>
						) : null}
					</View>
				</MessageAccessibleIndex>
			</View>
		</View>
	);
};

export default CompactMessage;
