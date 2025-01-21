import { NativeModules } from 'react-native';

import { isIOS } from '../../methods/helpers';

const { A11yFlow } = NativeModules;

interface IA11yFlowModule {
	setA11yOrder: (elements: number[], node: number) => void;
}

const A11yFlowModule: IA11yFlowModule = {
	setA11yOrder: (elements, node) => {
		if (isIOS) {
			A11yFlow.setA11yOrder(elements, node);
		}
	}
};

export default A11yFlowModule;
