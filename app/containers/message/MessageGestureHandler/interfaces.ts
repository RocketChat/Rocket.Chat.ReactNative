import Animated from 'react-native-reanimated';
import { TextStyle, StyleProp } from 'react-native';

export interface IRightActionsProps {
	transX: Animated.SharedValue<number>;
	handleThreadPress: () => void;
}

interface IRoomItemTouchables {
	onPress: (item?: any) => void;
	onLongPress?: (item?: any) => void;
	onThreadPress?: (tmid: string, id: string) => void;
}

export interface ITouchableProps extends IRoomItemTouchables {
	children: JSX.Element;
	rid: string;
	disabled: boolean;
	tmid: string;
	id: string;
	swipeEnabled: boolean;
	styles: StyleProp<TextStyle>;
}
