import { type ReactElement, useContext, useLayoutEffect } from 'react';
import { ScrollView } from 'react-native';
import { NavigationContext } from '@react-navigation/native';

import { useTheme } from '~/theme';
import { translucentHeader } from '~/lib/methods/helpers/navigation';
import { flattenListChildren, isListSeparator } from '../utils/listChildren';
import { NativeListContext } from '../native/context';
import styles from '../native/styles';

interface IListContainer {
	children: (ReactElement | null)[] | ReactElement | null;
	testID?: string;
	backgroundHidden?: boolean;
}

const useTranslucentHeader = () => {
	const navigation = useContext(NavigationContext);

	useLayoutEffect(() => {
		navigation?.setOptions(translucentHeader);
	}, [navigation]);
};

const ListContainer = ({ children, testID, backgroundHidden }: IListContainer) => {
	const { colors } = useTheme();
	useTranslucentHeader();
	const sections = flattenListChildren(children).filter(element => !isListSeparator(element));

	return (
		<ScrollView
			testID={testID}
			style={backgroundHidden ? undefined : { backgroundColor: colors.surfaceTint }}
			contentContainerStyle={styles.content}
			contentInsetAdjustmentBehavior='automatic'
			keyboardShouldPersistTaps='handled'
			keyboardDismissMode='interactive'>
			{sections.map((section, sectionIndex) => (
				<NativeListContext.Provider key={section.key} value={{ sectionIndex }}>
					{section}
				</NativeListContext.Provider>
			))}
		</ScrollView>
	);
};

ListContainer.displayName = 'List.Container';

export default ListContainer;
