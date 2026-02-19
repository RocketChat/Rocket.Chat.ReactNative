import { type FC, memo, type ReactNode, useContext } from 'react';
import { Pressable, type PressableProps } from 'react-native';

import MessageContext from './Context';

interface IProps extends PressableProps {
	children: ReactNode;
	onLongPress?: () => void;
}

const RCTouchable: FC<IProps> = ({ children, ...props }) => {
	'use memo';

	const { onLongPress } = useContext(MessageContext);

	return (
		<Pressable onLongPress={onLongPress} {...props}>
			{children}
		</Pressable>
	);
};

export default memo(RCTouchable);
