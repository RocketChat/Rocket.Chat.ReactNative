import React, { ReactElement } from 'react';
import { View } from 'react-native';

export const Container = ({ children }: { children: (ReactElement | null)[] }): ReactElement => (
	<View
		style={{
			flexDirection: 'row',
			paddingVertical: 12
		}}>
		{children}
	</View>
);
