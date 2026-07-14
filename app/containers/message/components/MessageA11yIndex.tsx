import { type ReactElement, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { A11y } from 'react-native-a11y-order';

import { useA11yGate } from '../stores/A11yGate';

interface IMessageA11yIndexProps {
	index: number;
	accessible?: boolean;
	accessibilityLabel?: string;
	accessibilityLanguage?: string;
	style?: StyleProp<ViewStyle>;
	children: ReactNode;
}

const MessageA11yIndex = ({
	index,
	accessible,
	accessibilityLabel,
	accessibilityLanguage,
	style,
	children
}: IMessageA11yIndexProps): ReactElement => {
	'use memo';

	const enabled = useA11yGate();

	if (!enabled) {
		// Preserve the style-bearing layout node when gated off; the unstyled call site passes no style.
		return style ? <View style={style}>{children}</View> : <>{children}</>;
	}

	return (
		<A11y.Index
			index={index}
			accessible={accessible}
			accessibilityLabel={accessibilityLabel}
			accessibilityLanguage={accessibilityLanguage}
			style={style}>
			{children}
		</A11y.Index>
	);
};

export default MessageA11yIndex;
