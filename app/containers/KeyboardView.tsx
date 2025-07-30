import React from 'react';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '../theme';

interface IKeyboardViewProps {
	backgroundColor?: string;
	children: React.ReactElement[] | React.ReactElement;
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
