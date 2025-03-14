import { NativeModules, Platform } from 'react-native';

const { A11yFlow } = NativeModules;

const A11yFlowModule = Platform.select({
	ios: {
		setA11yOrder: (elements: number[], node: number) => {
			if (!node || !elements) return;
			A11yFlow.setA11yOrder(elements, node);
		}
	}
});

export default A11yFlowModule;
