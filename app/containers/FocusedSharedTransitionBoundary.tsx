import { type ReactElement, type ReactNode } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { SharedTransitionBoundary } from 'react-native-reanimated';

export const FocusedSharedTransitionBoundary = ({ children }: { children: ReactNode }): ReactElement => {
	const isFocused = useIsFocused();
	return <SharedTransitionBoundary isActive={isFocused}>{children}</SharedTransitionBoundary>;
};
