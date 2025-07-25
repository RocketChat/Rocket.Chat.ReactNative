import { ViewProps } from 'react-native';

interface IA11yContainer extends ViewProps {
	disableOrder?: boolean;
}

const A11yContainer = ({ children }: IA11yContainer) => children;

export default A11yContainer;
