import type { ReactElement } from 'react';
import { View } from 'react-native';

export const Container = ({ children }: { children: (ReactElement | null)[] }) => {
	'use memo';

	return (
		<View
			style={{
				flexDirection: 'row',
				paddingVertical: 12
			}}>
			{children}
		</View>
	);
};
