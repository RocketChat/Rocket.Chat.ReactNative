import { type ReactNode } from 'react';
import { Text } from 'react-native';

import styles from '../../styles';
import MarkdownContext, { useMarkdownContext } from '../../contexts/MarkdownContext';

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
