import { Children, useState, type ReactElement } from 'react';
import { StyleSheet, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { Host } from '@expo/ui';
import { Group, List, RNHostView } from '@expo/ui/swift-ui';
import {
	listRowBackground,
	listRowInsets,
	listRowSeparator,
	listStyle,
	scrollContentBackground
} from '@expo/ui/swift-ui/modifiers';

const styles = StyleSheet.create({
	host: {
		flex: 1
	}
});

const listModifiers = [listStyle('plain'), scrollContentBackground('hidden')];
const rowModifiers = [
	listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 }),
	listRowBackground('clear'),
	listRowSeparator('hidden')
];

interface IListContainer {
	children: (ReactElement | null)[] | ReactElement | null;
	testID?: string;
}

const ListContainer = ({ children, testID }: IListContainer) => {
	const { width: windowWidth } = useWindowDimensions();
	const [width, setWidth] = useState(windowWidth);
	const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

	return (
		<Host style={styles.host} onLayout={onLayout}>
			<List modifiers={listModifiers} testID={testID}>
				{Children.toArray(children).map(child => (
					<Group key={(child as ReactElement).key} modifiers={rowModifiers}>
						<RNHostView matchContents>
							<View style={{ width }}>{child}</View>
						</RNHostView>
					</Group>
				))}
			</List>
		</Host>
	);
};

ListContainer.displayName = 'List.Container';

export default ListContainer;
