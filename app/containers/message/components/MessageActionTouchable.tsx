import { type ReactNode, type FC } from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { useMessageLongPress } from '../stores/MessageStore';

interface IProps extends PressableProps {
	children: ReactNode;
	onLongPress?: () => void;
}

const MessageActionTouchable: FC<IProps> = ({ children, ...props }) => {
	'use memo';

	const onLongPress = useMessageLongPress();

	return (
		<Pressable onLongPress={onLongPress} {...props}>
			{children}
		</Pressable>
	);
};

export default MessageActionTouchable;
