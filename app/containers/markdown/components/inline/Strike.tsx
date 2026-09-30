import { type ReactNode } from 'react';
import { Text } from 'react-native';

import styles from '~/containers/markdown/styles';
import MarkdownContext, { useMarkdownContext } from '~/containers/markdown/contexts/MarkdownContext';

interface IStrikeProps {
	children: ReactNode;
}

const Strike = ({ children }: IStrikeProps) => {
	const context = useMarkdownContext(styles.del);

	return (
		<Text style={styles.del}>
			<MarkdownContext.Provider value={context}>{children}</MarkdownContext.Provider>
		</Text>
	);
};

export default Strike;
