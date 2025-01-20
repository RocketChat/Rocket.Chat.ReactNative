import React, { createContext, useCallback, useContext, useState } from 'react';
import { findNodeHandle, View } from 'react-native';

import A11yModule from '../A11yModule/index';

interface IAccessibilityContextData {
	updatedOrder: ({ tag, order }: { tag: number; order?: number }) => void;
}

interface IAccessibilityOrderProviderProps {
	children: React.ReactNode;
	containerRef: React.RefObject<View>;
}

export const AccessibilityOrderContext = createContext({} as IAccessibilityContextData);

function AccessibilityOrderProvider({ children, containerRef }: IAccessibilityOrderProviderProps) {
	const [elements, setElements] = useState<{ tag: number; order?: number }[]>([]);

	const updatedOrder = useCallback(({ tag, order }: { tag: number; order?: number }) => {
		const parentTag = findNodeHandle(containerRef.current);

		if (!parentTag) throw new Error('OOPS');
		setElements(prev => {
			const updated = [...prev.filter(el => el.tag !== tag), { tag, order }];
			return updated.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
		});

		A11yModule.setA11yOrder(
			elements.map(item => item.tag),
			parentTag
		);
	}, []);

	return <AccessibilityOrderContext.Provider value={{ updatedOrder }}>{children}</AccessibilityOrderContext.Provider>;
}

function useAccessibilityOrder() {
	const context = useContext(AccessibilityOrderContext);

	return context;
}

export { AccessibilityOrderProvider, useAccessibilityOrder };
