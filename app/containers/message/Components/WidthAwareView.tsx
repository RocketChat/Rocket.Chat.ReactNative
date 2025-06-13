import { createContext, ReactElement, useState, useRef, useLayoutEffect } from 'react';
import { View, StyleSheet } from 'react-native';

export const WidthAwareContext = createContext(0);

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row'
	}
});

export const WidthAwareView = ({ children }: { children: ReactElement }) => {
	const [width, setWidth] = useState(0);
	const viewRef = useRef<View>(null);

	useLayoutEffect(() => {
		if (viewRef.current) {
			viewRef.current.measure((x, y, w) => {
				if (w) {
					setWidth(w);
				}
			});
		}
	}, []);

	return (
		<View ref={viewRef} style={styles.container}>
			<WidthAwareContext.Provider value={width}>{children}</WidthAwareContext.Provider>
		</View>
	);
};
