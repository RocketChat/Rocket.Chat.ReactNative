import { NativeModules } from 'react-native';

import { isIOS } from '../../methods/helpers';

const { A11yEvent } = NativeModules;

interface IA11yModule {
	setA11yOrder: (elements: number[], node: number) => void;
}

const A11yEventModule: IA11yModule = {
	setA11yOrder: (elements, node) => {
		if (isIOS) {
			A11yEvent.setA11yOrder(elements, node);
		}
	}
};

export default A11yEventModule;
