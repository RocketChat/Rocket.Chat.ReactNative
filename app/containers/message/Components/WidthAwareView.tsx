import { createContext, type ReactElement, useState } from 'react';
import { View, StyleSheet } from 'react-native';

export const WidthAwareContext = createContext(0);

const styles = StyleSheet.create({
	container: {
		flex: 1
	}
});

export const WidthAwareView = ({ children }: { children: ReactElement }) => {
	'use memo';

	const [width, setWidth] = useState(0);

	return (
		<View
			style={styles.container}
			onLayout={ev => {
				if (ev.nativeEvent.layout.width) {
					setWidth(Math.floor(ev.nativeEvent.layout.width));
				}
			}}>
			<WidthAwareContext.Provider value={width}>{children}</WidthAwareContext.Provider>
		</View>
	);
};
