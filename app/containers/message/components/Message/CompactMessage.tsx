import { View, type ViewStyle } from 'react-native';
import { A11y } from 'react-native-a11y-order';

import styles from '../../styles';
import RepliedThread from '../RepliedThread';
import MessageAvatar from '../MessageAvatar';
import Content from '../Content';
import Attachments from '../Attachments';
import {
	useContentData,
	useIsInfoMessage,
	useMessageField,
	useMessageGrouping,
	useMessageText,
	useThreadPosition
} from '../../stores/MessageStore';
import { useAutoTranslate } from '../../stores/MessageRoomStore';

const CompactMessage = () => {
	'use memo';

	const isHeader = useMessageGrouping();
	const { isThreadReply } = useThreadPosition();
	const isInfo = useIsInfoMessage();
	const { messageText, isTranslated } = useMessageText();
	const { t: type, attachments } = useContentData();
	const author = useMessageField(item => item.u);
	const { autoTranslateLanguage } = useAutoTranslate();

	const thread = isThreadReply ? <RepliedThread isHeader={isHeader} /> : null;
	const infoStyle: ViewStyle = isInfo ? { alignItems: 'center' } : {};

	return (
		<View style={[styles.container, { marginTop: 4 }]}>
			{thread}
			<View style={[styles.flex, infoStyle]}>
				<MessageAvatar small />
				<A11y.Index
					accessible={isTranslated}
					accessibilityLabel={messageText || ''}
					accessibilityLanguage={autoTranslateLanguage}
					index={2}
					style={{ flex: 1 }}>
					<View style={styles.messageContent}>
						<Content />
						{isInfo && type === 'message_pinned' ? (
							<View pointerEvents='none'>
								<Attachments attachments={attachments} author={author} />
							</View>
						) : null}
					</View>
				</A11y.Index>
			</View>
		</View>
	);
};

export default CompactMessage;
