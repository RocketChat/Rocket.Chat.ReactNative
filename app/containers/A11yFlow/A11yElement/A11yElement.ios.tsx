import React, { useEffect, useRef } from 'react';
import { View, ViewProps, findNodeHandle } from 'react-native';

import { useAccessibilityOrder } from '../contexts/useAccessibilityOrder';

interface IA11yElementProps extends ViewProps {
	order?: number;
}

const A11yElement = ({ order, children, ...rest }: IA11yElementProps) => {
	const elementRef = useRef<View>(null);
	const { updateElementsList } = useAccessibilityOrder();

	const handleUpdateOrder = () => {
		const tag = findNodeHandle(elementRef.current);
		if (!tag) return;

		updateElementsList({ tag, order });
	};

	useEffect(() => {
		handleUpdateOrder();
	}, []);

	return (
		<View {...rest} ref={elementRef}>
			{children}
		</View>
	);
};

export default A11yElement;
