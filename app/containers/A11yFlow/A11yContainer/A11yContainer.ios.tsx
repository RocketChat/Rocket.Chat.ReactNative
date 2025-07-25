import React, { useRef } from 'react';
import { View, ViewProps } from 'react-native';

import { AccessibilityOrderProvider } from '../contexts/useAccessibilityOrder';

interface IA11yContainer extends ViewProps {
	disableOrder?: boolean;
}

const A11yContainer = ({ children, disableOrder, ...rest }: IA11yContainer) => {
	const containerRef = useRef<View>(null);
	console.log('disableORder', disableOrder);
	return (
		<AccessibilityOrderProvider disableOrder={disableOrder} containerRef={containerRef}>
			<View {...rest} ref={containerRef}>
				{children}
			</View>
		</AccessibilityOrderProvider>
	);
};

export default A11yContainer;
