import { dequal } from 'dequal';
import React from 'react';
import { FlatList } from 'react-native';

import { themes } from '../../../lib/constants';
import { IPreviewItem } from '../../../definitions';
import { useTheme } from '../../../theme';
import styles from '../styles';
import Item from './Item';

interface IMessageBoxCommandsPreview {
	commandPreview: IPreviewItem[];
	showCommandPreview: boolean;
}

const CommandsPreview = React.memo(
	({ commandPreview, showCommandPreview }: IMessageBoxCommandsPreview) => {
		if (!showCommandPreview) {
			return null;
		}
		const { theme } = useTheme();
		return (
			<FlatList
				testID='commandbox-container'
				style={[styles.mentionList, { backgroundColor: themes[theme].messageboxBackground }]}
				data={commandPreview}
				renderItem={({ item }) => <Item item={item} />}
				keyExtractor={(item: any) => item.id}
				keyboardShouldPersistTaps='always'
				horizontal
				showsHorizontalScrollIndicator={false}
			/>
		);
	},
	(prevProps, nextProps) => {
		if (prevProps.showCommandPreview !== nextProps.showCommandPreview) {
			return false;
		}
		if (!dequal(prevProps.commandPreview, nextProps.commandPreview)) {
			return false;
		}
		return true;
	}
);

export default CommandsPreview;
