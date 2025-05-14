import React, { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Reanimated, { interpolate, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import type { StackScreenProps } from '@react-navigation/native-stack';

import Message from './Message';
import { history } from './Message/data';
import { useTelegramTransitions } from './hooks';
import styles from './styles';

const AnimatedTextInput = Reanimated.createAnimatedComponent(TextInput);

// type Props = StackScreenProps<ExamplesStackParamList>;

function ReanimatedChat({ navigation }) {
	const [isTGTransition, setTGTransition] = useState(false);
	const { bottom } = useSafeAreaInsets();
	// const bottom = 100;

	console.log('bottom', bottom);

	useEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<Text style={styles.header} onPress={() => setTGTransition(value => !value)}>
					{`Switch to ${isTGTransition ? 'Platform' : 'Telegram'}`}
				</Text>
			)
		});
	}, [isTGTransition]);

	const { height: telegram } = useTelegramTransitions();
	const { height: platform, progress } = useReanimatedKeyboardAnimation();
	const height = useDerivedValue(() => (isTGTransition ? telegram.value : platform.value), [isTGTransition]);

	const scrollViewStyle = useAnimatedStyle(
		() => ({
			transform: [{ translateY: height.value }, ...styles.inverted.transform]
		}),
		[]
	);
	const textInputStyle = useAnimatedStyle(
		() => ({
			height: 50,
			width: '100%',
			backgroundColor: '#BCBCBC',
			transform: [{ translateY: height.value }],
			paddingBottom: interpolate(progress.value, [0, 1], [bottom, 0])
		}),
		[bottom]
	);
	const fakeView = useAnimatedStyle(
		() => ({
			height: Math.abs(height.value),
			backgroundColor: 'red'
		}),
		[]
	);

	return (
		<View style={styles.container}>
			<Reanimated.ScrollView showsVerticalScrollIndicator={false} style={scrollViewStyle}>
				<View style={styles.inverted}>
					{/* <Reanimated.View style={fakeView} /> */}
					{history.map((message, index) => (
						<Message key={index} {...message} />
					))}
				</View>
			</Reanimated.ScrollView>
			<AnimatedTextInput style={textInputStyle} />
		</View>
	);
}

export default ReanimatedChat;
