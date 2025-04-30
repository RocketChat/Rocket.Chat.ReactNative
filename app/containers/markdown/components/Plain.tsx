import React from 'react';
import { Text } from 'react-native';
import { Plain as PlainProps } from '@rocket.chat/message-parser';

import { useTheme } from '../../../theme';
import usePreviewFormatText from '../../../lib/hooks/usePreviewFormatText';
import styles from '../styles';

interface IPlainProps {
	value: PlainProps['value'];
}

const Plain = ({ value }: IPlainProps): React.ReactElement => {
	const formattedText = usePreviewFormatText(value);
	const { colors } = useTheme();
	return (
		<Text accessibilityLabel={value} style={[styles.plainText, { color: colors.fontDefault }]}>
			{formattedText}
		</Text>
	);
};

export default Plain;
