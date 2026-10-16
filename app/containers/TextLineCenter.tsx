import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';

interface ITextLineCenter {
	lineHeight: number;
	children: ReactNode;
}

const styles = StyleSheet.create({
	line: {
		justifyContent: 'center'
	}
});

const TextLineCenter = ({ lineHeight, children }: ITextLineCenter) => {
	const { fontScale } = useResponsiveLayout();

	return <View style={[styles.line, { height: lineHeight * fontScale }]}>{children}</View>;
};

export default TextLineCenter;
