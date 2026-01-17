import React, { type ReactElement } from 'react';
import { View } from 'react-native';

export const Container = ({ children }: { children: (ReactElement | null)[] }): ReactElement => {
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
