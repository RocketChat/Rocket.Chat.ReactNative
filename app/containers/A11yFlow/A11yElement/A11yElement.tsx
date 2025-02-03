import { View, ViewProps } from 'react-native';

interface IA11yElementProps extends ViewProps {
	order?: number;
}

const A11yElement = ({ children, ...rest }: IA11yElementProps) => <View {...rest}>{children}</View>;

export default A11yElement;
