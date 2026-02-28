import React from 'react';
import { Text } from 'react-native';
import { type Plain as PlainProps } from '@rocket.chat/message-parser';

import { useTheme } from '../../../theme';
import styles from '../styles';
import { useResponsiveLayout } from '../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

interface IPlainProps {
	value: PlainProps['value'];
}

const Plain = ({ value }: IPlainProps): React.ReactElement => {
	const { colors } = useTheme();
	const { scaleFontSize } = useResponsiveLayout();
	return (
		<Text accessibilityLabel={value} style={[styles.plainText, { color: colors.fontDefault, fontSize: scaleFontSize(16), lineHeight: scaleFontSize(22) }]}>
			{value}
		</Text>
	);
};

export default Plain;
