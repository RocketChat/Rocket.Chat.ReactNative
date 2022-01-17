import React from 'react';
import { StyleSheet, View } from 'react-native';

import { withTheme } from '../../theme';
import { Header } from '.';

const styles = StyleSheet.create({
	container: {
		marginVertical: 16
	}
});

interface IListSection {
	children: React.ReactNode;
	title?: string;
	translateTitle?: boolean;
}

const ListSection = React.memo(({ children, title, translateTitle }: IListSection) => (
	<View style={styles.container}>
		{title ? <Header {...{ title, translateTitle }} /> : null}
		{children}
	</View>
));

ListSection.displayName = 'List.Section';

export default withTheme(ListSection);
