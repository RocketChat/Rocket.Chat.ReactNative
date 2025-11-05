import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Header } from '.';

const styles = StyleSheet.create({
	container: {
		marginBottom: 16
	}
});

interface IListSection {
	children: (React.ReactElement | null)[] | React.ReactElement | null;
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
