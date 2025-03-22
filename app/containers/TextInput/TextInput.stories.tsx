import React from 'react';
import { View, StyleSheet } from 'react-native';

import { FormTextInput } from '.';

const styles = StyleSheet.create({
	paddingHorizontal: {
		paddingHorizontal: 14
	}
});

export default {
	title: 'TextInput'
};

const item = {
	name: 'Rocket.Chat',
	longText: 'https://open.rocket.chat/images/logo/android-chrome-512x512.png'
};

export const ShortAndLong = () => (
	<>
		<View style={styles.paddingHorizontal}>
			<FormTextInput label='Short Text' placeholder='placeholder' value={item.name} />

			<FormTextInput label='Long Text' placeholder='placeholder' value={item.longText} />
		</View>
	</>
);
export const Icons = () => (
	<>
		<View style={styles.paddingHorizontal}>
			<FormTextInput label='Right icon' placeholder='placeholder' value={item.name} iconRight={'close'} />
			<FormTextInput label='Left icon' placeholder='placeholder' value={item.longText} iconLeft={'mail'} />
			<FormTextInput label='Both icons' placeholder='placeholder' value={item.longText} iconLeft={'mail'} iconRight={'add'} />
			<FormTextInput
				label='Icon and touchable clear input'
				placeholder='placeholder'
				value={item.longText}
				onClearInput={() => {}}
			/>
		</View>
	</>
);

export const Multiline = () => (
	<>
		<View style={styles.paddingHorizontal}>
			<FormTextInput label='Multiline text' placeholder='placeholder' multiline value={`${item.name}\n\n${item.longText}\n`} />
		</View>
	</>
);

export const SecureTextEntry = () => (
	<>
		<View style={styles.paddingHorizontal}>
			<FormTextInput label='Secure text disabled' placeholder='placeholder' value={item.name} />
			<FormTextInput label='Secure text enabled' placeholder='placeholder' value={item.name} secureTextEntry />
		</View>
	</>
);

export const Loading = () => (
	<>
		<View style={styles.paddingHorizontal}>
			<FormTextInput label='Loading false' placeholder='placeholder' value={item.name} loading={false} />
			<FormTextInput label='Loading true' placeholder='placeholder' value={item.name} loading />
		</View>
	</>
);
