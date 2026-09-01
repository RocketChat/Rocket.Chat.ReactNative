import { type ReactElement } from 'react';
import { Text } from 'react-native';
import { type Heading as HeadingProps } from '@rocket.chat/message-parser';

import styles from '../styles';
import { useTheme } from '../../../theme';
import Inline from './Inline';
import MarkdownContext, { useMarkdownContext } from '../contexts/MarkdownContext';

interface IHeadingProps {
	value: HeadingProps['value'];
	level: HeadingProps['level'];
}

const Heading = ({ value, level }: IHeadingProps): ReactElement => {
	const { colors } = useTheme();
	const textStyle = styles[`heading${level}`];
	const context = useMarkdownContext(textStyle);

	return (
		<Text style={[textStyle, { color: colors.fontDefault }]}>
			<MarkdownContext.Provider value={context}>
				<Inline value={value} />
			</MarkdownContext.Provider>
		</Text>
	);
};

export default Heading;
