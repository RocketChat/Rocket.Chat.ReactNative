import { type ReactNode } from 'react';
import { Text } from 'react-native';

import styles from '../../styles';
import MarkdownContext, { useMarkdownContext } from '../../contexts/MarkdownContext';

interface IItalicProps {
	children: ReactNode;
}

const Italic = ({ children }: IItalicProps) => {
	const context = useMarkdownContext(styles.emph);

	return (
		<Text style={styles.emph}>
			<MarkdownContext.Provider value={context}>{children}</MarkdownContext.Provider>
		</Text>
	);
};

export default Italic;
