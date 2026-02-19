import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import type { StyleProp, ViewStyle } from 'react-native';
import type { ReactElement } from 'react';

import { useTheme } from '../theme';

interface IKeyboardViewProps {
	backgroundColor?: string;
	children: ReactElement[] | ReactElement;
	style?: StyleProp<ViewStyle>;
}

const KeyboardView = ({ backgroundColor, children, style }: IKeyboardViewProps) => {
	const { colors } = useTheme();
	return (
		<KeyboardAvoidingView style={[{ flex: 1, backgroundColor: backgroundColor || colors.surfaceRoom }, style]} behavior='padding'>
			{children}
		</KeyboardAvoidingView>
	);
};

export default KeyboardView;
