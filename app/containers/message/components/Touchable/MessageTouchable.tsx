import { useTheme } from '../../../../theme';
import MessageA11yOrder from '../MessageA11yOrder';
import MessageA11yIndex from '../MessageA11yIndex';
import Touch from './Touch';
import Message, { type TMessageProps } from '../Message/Message';
import { useLastFocusedMessageRef } from '../../../../lib/a11y/useLastFocusedMessageRef';
import { useMessageAccessibilityLabel } from '../../hooks/useMessageAccessibilityLabel';
import { useMessageAccessibilityActions } from '../../hooks/useMessageAccessibilityActions';
import { useMessageAccessibilityHint } from '../../hooks/useMessageAccessibilityHint';
import { useIsBeingEdited } from '../../stores/MessageActionStore';
import {
	useIsInfoMessage,
	useMessageId,
	useMessageLongPress,
	useMessagePress,
	useMessageStatus,
	useMessageTouchable
} from '../../stores/MessageStore';

const MessageTouchable = (props: TMessageProps) => {
	'use memo';

	const { colors } = useTheme();
	const { ref: touchRef, markAsLastFocused } = useLastFocusedMessageRef();
	const isInfo = useIsInfoMessage();
	const { hasError } = useMessageStatus();
	const { tappable } = useMessageTouchable();
	const id = useMessageId();
	const isBeingEdited = useIsBeingEdited(id);
	const onPressAction = useMessagePress();
	const onLongPress = useMessageLongPress();
	const accessibilityLabelValue = useMessageAccessibilityLabel();
	const accessibilityActions = useMessageAccessibilityActions(!tappable);
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
			<MessageA11yOrder>
				<Message isPreview={props.isPreview} />
			</MessageA11yOrder>
		);
	}

	const handleLongPress = () => {
		markAsLastFocused();
		onLongPress();
	};

	return (
		<MessageA11yOrder>
			<MessageA11yIndex index={1}>
				<Touch
					componentRef={touchRef}
					onLongPress={handleLongPress}
					onPress={onPressAction}
					disabled={!tappable}
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
			</MessageA11yIndex>
		</MessageA11yOrder>
	);
};

export default MessageTouchable;
