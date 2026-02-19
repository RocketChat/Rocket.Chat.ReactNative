import { StyleSheet, View } from 'react-native';
import { type ReactElement } from 'react';

import { Header } from '.';

const styles = StyleSheet.create({
	container: {
		marginBottom: 16
	}
});

interface IListSection {
	children: (ReactElement | null)[] | ReactElement | null;
	title?: string;
	translateTitle?: boolean;
}

const ListSection = ({ children, title, translateTitle }: IListSection) => {
	'use memo';

	return (
		<View style={styles.container}>
			{title ? <Header {...{ title, translateTitle }} /> : null}
			{children}
		</View>
	);
};

ListSection.displayName = 'List.Section';

export default ListSection;
