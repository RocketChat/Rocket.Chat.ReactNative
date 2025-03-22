import React, { useContext, useMemo } from 'react';
import { View } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import MessageContext from './Context';
import User from './User';
import styles from './styles';
import RepliedThread from './RepliedThread';
import MessageAvatar from './MessageAvatar';
import Attachments from './Components/Attachments';
import Urls from './Urls';
import Thread from './Thread';
import Blocks from './Blocks';
import Reactions from './Reactions';
import Broadcast from './Broadcast';
import Discussion from './Discussion';
import Content from './Content';
import CallButton from './CallButton';
import { themes } from '../../lib/constants';
import { IMessage, IMessageInner, IMessageTouchable } from './interfaces';
import { useTheme } from '../../theme';
import RightIcons from './Components/RightIcons';
import i18n from '../../i18n';
import { getInfoMessage } from './utils';

const MessageInner = React.memo((props: IMessageInner) => {
	if (props.isPreview) {
		return (
			<>
				<User {...props} />
				<>
					<Content {...props} />
					<Attachments {...props} />
				</>
				<Urls {...props} />
			</>
		);
	}

	if (props.type === 'discussion-created') {
		return (
			<>
				<User {...props} />
				<Discussion {...props} />
			</>
		);
	}

	if (props.type === 'jitsi_call_started') {
		return (
			<>
				<User {...props} />
				<Content {...props} isInfo />
				<CallButton {...props} />
			</>
		);
	}

	if (props.blocks && props.blocks.length) {
		return (
			<>
				<User {...props} />
				<Blocks {...props} />
				<Thread {...props} />
				<Reactions {...props} />
			</>
		);
	}

	return (
		<>
			<User {...props} />
			<>
				<Content {...props} />
				<Attachments {...props} />
			</>
			<Urls {...props} />
			<Thread {...props} />
			<Reactions {...props} />
			<Broadcast {...props} />
		</>
	);
});
MessageInner.displayName = 'MessageInner';

const Message = React.memo((props: IMessage) => {
	if (props.isThreadReply || props.isThreadSequential || props.isInfo || props.isIgnored) {
		const thread = props.isThreadReply ? <RepliedThread {...props} /> : null;
		return (
			<View style={[styles.container, props.style]}>
				{thread}
				<View style={styles.flex}>
					<MessageAvatar small {...props} />
					<View style={[styles.messageContent, props.isHeader && styles.messageContentWithHeader]}>
						<Content {...props} />
						{props.isInfo && props.type === 'message_pinned' ? (
							<View pointerEvents='none'>
								<Attachments {...props} />
							</View>
						) : null}
					</View>
				</View>
			</View>
		);
	}

	return (
		<View style={[styles.container, props.style]}>
			<View style={styles.flex}>
				<MessageAvatar {...props} />
				<View style={[styles.messageContent, props.isHeader && styles.messageContentWithHeader]}>
					<MessageInner {...props} />
				</View>
				{!props.isHeader ? (
					<RightIcons
						type={props.type}
						msg={props.msg}
						isEdited={props.isEdited}
						hasError={props.hasError}
						isReadReceiptEnabled={props.isReadReceiptEnabled}
						unread={props.unread}
						pinned={props.pinned}
						isTranslated={props.isTranslated}
					/>
				) : null}
			</View>
		</View>
	);
});
Message.displayName = 'Message';

const MessageTouchable = React.memo((props: IMessageTouchable & IMessage) => {
	const { onPress, onLongPress } = useContext(MessageContext);
	const { theme } = useTheme();

	let backgroundColor = undefined;
	if (props.isBeingEdited) {
		backgroundColor = themes[theme].statusBackgroundWarning2;
	}
	if (props.highlighted) {
		backgroundColor = themes[theme].surfaceNeutral;
	}

	// temp accessibilityLabel
	const accessibilityLabel = useMemo(() => {
		let label = '';
		label = props.isInfo ? (props.msg as string) : `${props.tmid ? `thread message ${props.msg}` : props.msg}`;
		if (props.isThreadReply) {
			label = `replying to ${props.tmid ? `thread message ${props.msg}` : props}`;
		}
		if (props.isThreadSequential) {
			label = `thread message ${props.msg}`;
		}
		if (props.isEncrypted) {
			label = i18n.t('Encrypted_message');
		}
		if (props.isInfo) {
			// @ts-ignore
			label = getInfoMessage({ ...props });
		}
		const hour = props.ts ? new Date(props.ts).toLocaleTimeString() : '';
		const user = props.useRealName ? props.author?.name : props.author?.username || '';
		return `${user} ${hour} ${label}`;
	}, []);

	if (props.hasError) {
		return (
			<View>
				<Message {...props} />
			</View>
		);
	}

	return (
		<Touchable
			onLongPress={onLongPress}
			onPress={onPress}
			disabled={(props.isInfo && !props.isThreadReply) || props.archived || props.isTemp || props.type === 'jitsi_call_started'}
			style={{ backgroundColor }}>
			<View accessible accessibilityLabel={accessibilityLabel}>
				<Message {...props} />
			</View>
		</Touchable>
	);
});

MessageTouchable.displayName = 'MessageTouchable';

export default MessageTouchable;
