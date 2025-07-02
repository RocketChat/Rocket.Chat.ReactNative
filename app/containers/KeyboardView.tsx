import React from 'react';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { useTheme } from '../theme';

interface IKeyboardViewProps {
	backgroundColor?: string;
	children: React.ReactElement[] | React.ReactElement;
}

const KeyboardView = ({ backgroundColor, children }: IKeyboardViewProps) => {
	const { colors } = useTheme();
	return (
		<KeyboardAvoidingView style={[{ flex: 1, backgroundColor: backgroundColor || colors.surfaceRoom }]} behavior='padding'>
			{children}
		</KeyboardAvoidingView>
	);
};

export default KeyboardView;
