import { type ReactElement, type ReactNode } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { SharedTransitionBoundary } from 'react-native-reanimated';

export const FocusedSharedTransitionBoundary = ({
	children,
	isEnabled = true
}: {
	children: ReactNode;
	isEnabled?: boolean;
}): ReactElement => {
	const isFocused = useIsFocused();
	return <SharedTransitionBoundary isActive={isEnabled && isFocused}>{children}</SharedTransitionBoundary>;
};
