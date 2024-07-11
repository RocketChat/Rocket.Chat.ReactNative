import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';

const styles = StyleSheet.create({
	container: {
		paddingVertical: 16
	}
});

interface IListContainer {
	children: (React.ReactElement | null)[] | React.ReactElement | null;
	testID?: string;
}
const ListContainer = ({ children, ...props }: IListContainer) => (
	<ScrollView
		contentContainerStyle={styles.container}
		scrollIndicatorInsets={{ right: 1 }} // https://github.com/facebook/react-native/issues/26610#issuecomment-539843444
		{...scrollPersistTaps}
		{...props}>
		{children}
	</ScrollView>
);

ListContainer.displayName = 'List.Container';

export default ListContainer;
