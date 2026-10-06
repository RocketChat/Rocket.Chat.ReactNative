import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import Header from './ListHeader';
import NativeListSection from '../native/components/Section';
import { useIsNativeList } from '../native/context';

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
	const isNativeList = useIsNativeList();

	if (isNativeList) {
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
