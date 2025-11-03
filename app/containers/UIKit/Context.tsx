import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { BlockContext } from '@rocket.chat/ui-kit';

import { type IContext } from './interfaces';

const styles = StyleSheet.create({
	container: {
		minHeight: 36,
		alignItems: 'center',
		flexDirection: 'row'
	}
});

export const Context = ({ elements, parser }: IContext) => (
	<View style={styles.container}>{elements?.map(element => parser?.renderContext(element, BlockContext.CONTEXT, parser))}</View>
);
