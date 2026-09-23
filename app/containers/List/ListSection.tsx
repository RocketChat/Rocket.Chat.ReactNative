import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import Header from './ListHeader';

const styles = StyleSheet.create({
	container: {
		marginBottom: 16
	}
});

interface IListSection {
	children: ReactNode;
	title?: string;
	translateTitle?: boolean;
}

const ListSection = ({ children, title, translateTitle }: IListSection) => {
	return (
		<View style={styles.container}>
			{title ? <Header {...{ title, translateTitle }} /> : null}
			{children}
		</View>
	);
};

ListSection.displayName = 'List.Section';

export default ListSection;
