import { A11y } from 'react-native-a11y-order';

import { useTheme } from '../../../theme';
import { WidthAwareView } from './WidthAwareView';
import { useResponsiveLayout } from '../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import Touch from './Touch';
import BlocksBranch from './Message/BlocksBranch';
import JitsiBranch from './Message/JitsiBranch';
import DiscussionBranch from './Message/DiscussionBranch';
import PreviewBranch from './Message/PreviewBranch';
import DefaultBranch from './Message/DefaultBranch';
import CompactMessage from './Message/CompactMessage';
import NormalMessage from './Message/NormalMessage';
import { useLastFocusedMessageRef } from '../../../lib/a11y/useLastFocusedMessageRef';
import { useMessageAccessibilityLabel } from '../hooks/useMessageAccessibilityLabel';
import { useMessageAccessibilityActions } from '../hooks/useMessageAccessibilityActions';
import { useMessageAccessibilityHint } from '../hooks/useMessageAccessibilityHint';
import { useIsBeingEdited } from '../../../views/RoomView/InteractionStore';
import { useArchived } from '../stores/MessageRoomStore';
import {
	useBlocks,
	useIsInfo,
	useMessageField,
	useMessageGrouping,
	useMessageIgnored,
	useMessageLongPress,
	useMessagePress,
	useMessageStatus,
	useThreadPosition
} from '../stores/MessageStore';

type TMessageProps = {
	isPreview?: boolean;
	highlighted?: boolean;
};

export const MessageInner = (props: TMessageProps) => {
	'use memo';

	const { isLargeFontScale } = useResponsiveLayout();
	const isHeader = useMessageGrouping();
	const type = useMessageField(item => item.t);
	const { blocks } = useBlocks();
	const showTimeLarge = isLargeFontScale && isHeader;

	let branch;
	if (blocks && blocks.length) {
		branch = <BlocksBranch showTimeLarge={showTimeLarge} />;
	} else if (type === 'jitsi_call_started') {
		branch = <JitsiBranch showTimeLarge={showTimeLarge} />;
	} else if (type === 'discussion-created') {
		branch = <DiscussionBranch showTimeLarge={showTimeLarge} />;
	} else if (props.isPreview) {
		branch = <PreviewBranch showTimeLarge={showTimeLarge} />;
	} else {
		branch = <DefaultBranch showTimeLarge={showTimeLarge} />;
	}

	return <WidthAwareView>{branch}</WidthAwareView>;
};
MessageInner.displayName = 'MessageInner';

const Message = (props: TMessageProps) => {
	'use memo';

	const { isThreadReply, isThreadSequential } = useThreadPosition();
	const isInfo = useIsInfo();
	const isIgnored = useMessageIgnored();

	if (isThreadReply || isThreadSequential || isInfo || isIgnored) {
		return <CompactMessage />;
	}

	return <NormalMessage isPreview={props.isPreview} />;
};
Message.displayName = 'Message';

const MessageTouchable = (props: TMessageProps) => {
	'use memo';

	const { colors } = useTheme();
	const { ref: touchRef, markAsLastFocused } = useLastFocusedMessageRef();
	const { isThreadReply } = useThreadPosition();
	const isInfo = useIsInfo();
	const archived = useArchived();
	const { hasError, isTemp } = useMessageStatus();
	const type = useMessageField(item => item.t);
	const id = useMessageField(item => item.id);
	const isBeingEdited = useIsBeingEdited(id);
	const onPressAction = useMessagePress();
	const onLongPress = useMessageLongPress();
	const accessibilityLabelValue = useMessageAccessibilityLabel();
	const isDisabled = (isInfo && !isThreadReply) || archived || isTemp || type === 'jitsi_call_started';
	const accessibilityActions = useMessageAccessibilityActions(isDisabled);
	const accessibilityHint = useMessageAccessibilityHint();

	let backgroundColor = undefined;
	if (isBeingEdited) {
		backgroundColor = colors.statusBackgroundWarning2;
	}
	if (props.highlighted) {
		backgroundColor = colors.surfaceNeutral;
	}

	if (hasError || isInfo) {
		return (
			<A11y.Order>
				<Message isPreview={props.isPreview} />
			</A11y.Order>
		);
	}

	const handleLongPress = () => {
		markAsLastFocused();
		onLongPress();
	};

	return (
		<A11y.Order>
			<A11y.Index index={1}>
				<Touch
					componentRef={touchRef}
					onLongPress={handleLongPress}
					onPress={onPressAction}
					disabled={isDisabled}
					style={{ backgroundColor }}
					testID={isBeingEdited ? `message-editing-${id}` : undefined}
					accessible
					accessibilityRole='button'
					accessibilityLabel={accessibilityLabelValue}
					accessibilityHint={accessibilityHint}
					accessibilityActions={accessibilityActions}
					onAccessibilityAction={e => {
						if (e.nativeEvent.actionName === 'showActions') handleLongPress();
					}}>
					<Message isPreview={props.isPreview} />
				</Touch>
			</A11y.Index>
		</A11y.Order>
	);
};

MessageTouchable.displayName = 'MessageTouchable';

export default MessageTouchable;
