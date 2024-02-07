import React, { memo, useEffect, useState } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomIcon } from '../../../../containers/CustomIcon';
import { useTheme } from '../../../../theme';
import Touch from '../../../../containers/Touch';
import { emitter, TKeyEmitterEvent } from '../../../../lib/methods/helpers/emitter';

const EDGE_DISTANCE = 15;

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		right: EDGE_DISTANCE
	},
	button: {
		borderRadius: 25
	},
	content: {
		width: 50,
		height: 50,
		borderRadius: 25,
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center'
	}
});

const NavBottomFAB = memo(
	({ visible, onPress, isThread }: { visible: boolean; onPress: Function; isThread: boolean }): React.ReactElement | null => {
		console.count(`NavBottomFAB${isThread ? 'Thread' : ''}`);
		const { colors } = useTheme();
		const [keyboardHeight, setKeyboardHeight] = useState(0);
		const [composerHeight, setComposerHeight] = useState(0);
		const { bottom } = useSafeAreaInsets();

		useEffect(() => {
			const keyboardEvent: TKeyEmitterEvent = `setKeyboardHeight${isThread ? 'Thread' : ''}`;
			const composerEvent: TKeyEmitterEvent = `setComposerHeight${isThread ? 'Thread' : ''}`;
			emitter.on(keyboardEvent, height => {
				setKeyboardHeight(height);
			});
			emitter.on(composerEvent, height => {
				setComposerHeight(height);
			});

			return () => {
				emitter.off(keyboardEvent);
				emitter.off(composerEvent);
			};
		}, [isThread]);

		if (!visible) {
			return null;
		}

		return (
			<View
				style={[
					styles.container,
					{
						...Platform.select({
							ios: {
								bottom: keyboardHeight + composerHeight + (keyboardHeight ? 0 : bottom) + EDGE_DISTANCE
							},
							android: {
								top: 15,
								scaleY: -1
							}
						})
					}
				]}
				testID='nav-jump-to-bottom'
			>
				<Touch onPress={() => onPress()} style={[styles.button, { backgroundColor: colors.backgroundColor }]}>
					<View style={[styles.content, { borderColor: colors.borderColor }]}>
						<CustomIcon name='chevron-down' color={colors.auxiliaryTintColor} size={36} />
					</View>
				</Touch>
			</View>
		);
	}
);

export default NavBottomFAB;
