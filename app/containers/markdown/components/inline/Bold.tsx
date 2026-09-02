import { type ReactNode } from 'react';
import { Text } from 'react-native';

import sharedStyles from '../../../../views/Styles';
import MarkdownContext, { useMarkdownContext } from '../../contexts/MarkdownContext';

interface IBoldProps {
	children: ReactNode;
}

const Bold = ({ children }: IBoldProps) => {
	const context = useMarkdownContext(sharedStyles.textBold);

	return (
		<Text style={sharedStyles.textBold}>
			<MarkdownContext.Provider value={context}>{children}</MarkdownContext.Provider>
		</Text>
	);
};

export default Bold;
