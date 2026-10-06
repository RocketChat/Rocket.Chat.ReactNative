import { type ReactElement } from 'react';
import { ScrollView } from 'react-native';

import { useTheme } from '~/theme';
import ListSection from './ListSection';
import { isNativeListSection } from '../native/utils/rowMarkers';
import { flattenListChildren, isListSeparator } from '../utils/listChildren';
import { NativeListContext } from '../native/context';
import styles from '../native/styles';

export interface IListSelection {
	selectedTag: string | null;
}

interface IListContainer {
	children: (ReactElement | null)[] | ReactElement | null;
	testID?: string;
	selection?: IListSelection;
	backgroundHidden?: boolean;
}

const isSection = (element: ReactElement) => element.type === ListSection || isNativeListSection(element.type);

const groupIntoSections = (elements: ReactElement[]) => {
	const sections: ReactElement[] = [];
	let rows: ReactElement[] = [];
	const closeRowsSection = () => {
		if (rows.length) {
			sections.push(<ListSection key={rows[0].key}>{rows}</ListSection>);
			rows = [];
		}
	};
	elements.forEach(element => {
		if (isSection(element)) {
			closeRowsSection();
			sections.push(element);
		} else {
			rows.push(element);
		}
	});
	closeRowsSection();
	return sections;
};

const ListContainer = ({ children, testID, selection, backgroundHidden }: IListContainer) => {
	const { colors } = useTheme();
	const selectedTag = selection?.selectedTag ?? null;
	const sections = groupIntoSections(flattenListChildren(children).filter(element => !isListSeparator(element)));

	return (
		<ScrollView
			testID={testID}
			style={backgroundHidden ? undefined : { backgroundColor: colors.surfaceTint }}
			contentContainerStyle={styles.content}
			contentInsetAdjustmentBehavior='automatic'
			keyboardShouldPersistTaps='handled'
			keyboardDismissMode='interactive'>
			{sections.map((section, sectionIndex) => (
				<NativeListContext.Provider key={section.key} value={{ selectedTag, sectionIndex }}>
					{section}
				</NativeListContext.Provider>
			))}
		</ScrollView>
	);
};

ListContainer.displayName = 'List.Container';

export default ListContainer;
