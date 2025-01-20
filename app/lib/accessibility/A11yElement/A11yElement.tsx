import React, { useEffect, useRef } from 'react';
import { View, ViewProps, findNodeHandle } from 'react-native';

import { useAccessibilityOrder } from '../contexts/useAccessibilityOrder';

interface IA11yElementProps extends ViewProps {
	order?: number;
}

const A11yElement: React.FC<IA11yElementProps> = ({ order, children, ...rest }) => {
	const elementRef = useRef<View>(null);
	const { updatedOrder } = useAccessibilityOrder();

	const handleUpdateOrder = () => {
		const tag = findNodeHandle(elementRef.current);

		if (!tag) return;
		updatedOrder({ tag, order });
	};

	useEffect(() => {
		handleUpdateOrder();
	}, []);

	return (
		<View ref={elementRef} {...rest}>
			{children}
		</View>
	);
};

export default A11yElement;
