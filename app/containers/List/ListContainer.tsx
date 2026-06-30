import { type ReactElement } from 'react';
import { ScrollView, type ScrollViewProps, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';

const styles = StyleSheet.create({
	container: {
		paddingVertical: 16
	}
});

interface IListContainer extends ScrollViewProps {
	children: (ReactElement | null)[] | ReactElement | null;
	testID?: string;
}
const ListContainer = ({ children, contentContainerStyle, ...props }: IListContainer) => {
	'use memo';

	const { bottom } = useSafeAreaInsets();

	return (
		<ScrollView
			contentContainerStyle={[styles.container, { paddingBottom: bottom }, contentContainerStyle]}
			scrollIndicatorInsets={{ right: 1 }} // https://github.com/facebook/react-native/issues/26610#issuecomment-539843444
			{...scrollPersistTaps}
			{...props}>
			{children}
		</ScrollView>
	);
};

ListContainer.displayName = 'List.Container';

export default ListContainer;
