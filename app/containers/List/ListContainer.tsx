import { ScrollView, StyleSheet } from 'react-native';
import { type ReactElement } from 'react';

import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';

const styles = StyleSheet.create({
	container: {
		paddingVertical: 16
	}
});

interface IListContainer {
	children: (ReactElement | null)[] | ReactElement | null;
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
