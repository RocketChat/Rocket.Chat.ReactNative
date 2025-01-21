import React, { useRef } from 'react';
import { View, ViewProps } from 'react-native';

import { AccessibilityOrderProvider } from '../contexts/useAccessibilityOrder';

interface IA11yContainer extends ViewProps {}

const A11yContainer = ({ children, ...rest }: IA11yContainer) => {
	const containerRef = useRef<View>(null);

	return (
		<AccessibilityOrderProvider containerRef={containerRef}>
			<View {...rest} ref={containerRef}>
				{children}
			</View>
		</AccessibilityOrderProvider>
	);
};

export default A11yContainer;
