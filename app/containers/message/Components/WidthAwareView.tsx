import { createContext, ReactElement, useState } from 'react';
import { View, StyleSheet } from 'react-native';

export const WidthAwareContext = createContext(0);

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row'
	}
});

export const WidthAwareView = ({ children }: { children: ReactElement }) => {
	const [width, setWidth] = useState(0);

	return (
		<View
			style={styles.container}
			onLayout={ev => {
				if (ev.nativeEvent.layout.width) {
					setWidth(ev.nativeEvent.layout.width);
				}
			}}>
			<WidthAwareContext.Provider value={width}>{children}</WidthAwareContext.Provider>
		</View>
	);
};
