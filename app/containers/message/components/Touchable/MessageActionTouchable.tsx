import { type ReactNode, type FC } from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { useMessageLongPress } from '~/containers/message/stores/MessageStore';
import { useIsMessageContextMenuEnabled } from '~/containers/message/hooks/useMessageContextMenu';

interface IProps extends PressableProps {
	children: ReactNode;
	onLongPress?: () => void;
}

const MessageActionTouchable: FC<IProps> = ({ children, onLongPress, ...props }) => {
	const onMessageLongPress = useMessageLongPress();
	const isContextMenuEnabled = useIsMessageContextMenuEnabled();
	const defaultLongPress = isContextMenuEnabled ? undefined : onMessageLongPress;

	return (
		<Pressable onLongPress={onLongPress ?? defaultLongPress} {...props}>
			{children}
		</Pressable>
	);
};

export default MessageActionTouchable;
