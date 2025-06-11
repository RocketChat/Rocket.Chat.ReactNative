import React, { createContext, useContext, useEffect, useState } from 'react';
import { findNodeHandle, View } from 'react-native';

import A11yFlowModule from '../A11yFlowModule';

interface IElement {
	tag: number;
	order?: number;
}
interface IAccessibilityContextData {
	updateElementsList: (element: IElement) => void;
}

interface IAccessibilityOrderProviderProps {
	children: React.ReactNode;
	containerRef: React.RefObject<View | null>;
}

export const AccessibilityOrderContext = createContext({} as IAccessibilityContextData);

function AccessibilityOrderProvider({ children, containerRef }: IAccessibilityOrderProviderProps) {
	const [elements, setElements] = useState<IElement[]>([]);

	const sortElements = (elementsList: IElement[]) => elementsList.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

	const extractTags = (elements: IElement[]) => elements.map(item => item.tag);

	const updateElementsList = (element: IElement) => {
		setElements(prevState => sortElements([...prevState, element]));
	};

	const updateAccessibilityOrder = () => {
		const parentTag = findNodeHandle(containerRef.current);

		if (!parentTag) return;

		A11yFlowModule?.setA11yOrder(extractTags(elements), parentTag);
	};

	useEffect(() => {
		updateAccessibilityOrder();
	}, [elements]);

	return <AccessibilityOrderContext.Provider value={{ updateElementsList }}>{children}</AccessibilityOrderContext.Provider>;
}

function useAccessibilityOrder() {
	const context = useContext(AccessibilityOrderContext);

	return context;
}

export { AccessibilityOrderProvider, useAccessibilityOrder };
