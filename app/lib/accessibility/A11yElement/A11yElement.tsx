import { ViewProps } from 'react-native';

interface IA11yElementProps extends ViewProps {
	order?: number;
}

const A11yElement = ({ children }: IA11yElementProps) => <>{children}</>;

export default A11yElement;
