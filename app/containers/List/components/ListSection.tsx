import { type ReactElement, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import Header from './ListHeader';
import { PADDING_HORIZONTAL } from '../constants';
import NativeListSection from '../native/components/Section';
import { useIsNativeList } from '../native/context';

const styles = StyleSheet.create({
	container: {
		marginBottom: 16
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	headerTrailing: {
		marginRight: PADDING_HORIZONTAL
	}
});

interface IListSection {
	children: ReactNode;
	title?: string;
	translateTitle?: boolean;
	headerTrailing?: ReactElement;
}

const ListSection = ({ children, title, translateTitle, headerTrailing }: IListSection) => {
	const isNativeList = useIsNativeList();

	if (isNativeList) {
		return (
			<NativeListSection title={title} translateTitle={translateTitle} headerTrailing={headerTrailing}>
				{children}
			</NativeListSection>
		);
	}

	return (
		<View style={styles.container}>
			{title ? (
				<View style={styles.header}>
					<Header title={title} translateTitle={translateTitle} />
					{headerTrailing ? <View style={styles.headerTrailing}>{headerTrailing}</View> : null}
				</View>
			) : null}
			{children}
		</View>
	);
};

ListSection.displayName = 'List.Section';

export default ListSection;
