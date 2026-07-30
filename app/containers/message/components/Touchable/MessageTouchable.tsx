import { A11y } from 'react-native-a11y-order';

import { useTheme } from '../../../../theme';
import Touch from '../../../Touch';
import Message, { type TMessageProps } from '../Message/Message';
import { useLastFocusedMessageRef } from '../../../../lib/a11y/useLastFocusedMessageRef';
import { useMessageAccessibilityLabel } from '../../hooks/useMessageAccessibilityLabel';
import { useMessageAccessibilityActions } from '../../hooks/useMessageAccessibilityActions';
import { useMessageAccessibilityHint } from '../../hooks/useMessageAccessibilityHint';
import { useIsBeingEdited } from '../../stores/MessageActionStore';
import {
	useIsInfoMessage,
	useMessageField,
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
	const id = useMessageField(item => item.id);
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
			</A11y.Index>
		</A11y.Order>
	);
};

export default MessageTouchable;
