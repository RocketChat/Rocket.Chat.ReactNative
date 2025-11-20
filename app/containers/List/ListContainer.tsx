import React from 'react';
import { ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

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
const ListContainer = ({ children, ...props }: IListContainer) => {
	'use memo';

	return (
		<ScrollView
			contentContainerStyle={styles.container}
			scrollIndicatorInsets={{ right: 1 }} // https://github.com/facebook/react-native/issues/26610#issuecomment-539843444
			{...scrollPersistTaps}
			{...props}>
			{children}
		</ScrollView>
	);
};

ListContainer.displayName = 'List.Container';

export default ListContainer;
