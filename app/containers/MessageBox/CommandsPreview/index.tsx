import React from 'react';
import { FlatList } from 'react-native';
import { dequal } from 'dequal';

import Item from './Item';
import styles from '../styles';
import { themes } from '../../../constants/colors';
import { withTheme } from '../../../theme';

interface IMessageBoxCommandsPreview {
	commandPreview: [];
	showCommandPreview: boolean;
	theme?: string;
}

const CommandsPreview = React.memo(
	({ theme, commandPreview, showCommandPreview }: IMessageBoxCommandsPreview) => {
		if (!showCommandPreview) {
			return null;
		}
		return (
			<FlatList
				testID='commandbox-container'
				style={[styles.mentionList, { backgroundColor: themes[theme!].messageboxBackground }]}
				data={commandPreview}
				renderItem={({ item }) => <Item item={item} theme={theme} />}
				keyExtractor={(item: any) => item.id}
				keyboardShouldPersistTaps='always'
				horizontal
				showsHorizontalScrollIndicator={false}
			/>
		);
	},
	(prevProps, nextProps) => {
		if (prevProps.theme !== nextProps.theme) {
			return false;
		}
		if (prevProps.showCommandPreview !== nextProps.showCommandPreview) {
			return false;
		}
		if (!dequal(prevProps.commandPreview, nextProps.commandPreview)) {
			return false;
		}
		return true;
	}
);

export default withTheme(CommandsPreview);
