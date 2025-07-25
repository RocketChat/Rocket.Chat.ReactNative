import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

interface IPlatformPressable extends PressableProps {
	style?: StyleProp<ViewStyle>;
	children: React.ReactNode;
}

export const PlatformPressable = ({ children, style, ...props }: IPlatformPressable) => (
	<Pressable style={style} {...props}>
		{children}
	</Pressable>
);
