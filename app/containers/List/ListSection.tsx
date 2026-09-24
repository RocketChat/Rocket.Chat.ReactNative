import { useContext, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import Header from './ListHeader';
import NativeListSection from './NativeListSection';
import { NativeListContext } from './NativeListContext';

const styles = StyleSheet.create({
	container: {
		marginBottom: 16
	}
});

interface IListSection {
	children: ReactNode;
	title?: string;
	translateTitle?: boolean;
}

const ListSection = ({ children, title, translateTitle }: IListSection) => {
	const nativeListMode = useContext(NativeListContext);

	if (nativeListMode === 'native') {
		return (
			<NativeListSection title={title} translateTitle={translateTitle}>
				{children}
			</NativeListSection>
		);
	}

	return (
		<View style={styles.container}>
			{title ? <Header title={title} translateTitle={translateTitle} /> : null}
			{children}
		</View>
	);
};

ListSection.displayName = 'List.Section';

export default ListSection;
