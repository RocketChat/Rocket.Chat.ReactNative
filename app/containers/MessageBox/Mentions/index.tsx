import React from 'react';
import { FlatList, View } from 'react-native';
import { dequal } from 'dequal';

import styles from '../styles';
import MentionItem from './MentionItem';
import { themes } from '../../../constants/colors';

interface IMessageBoxMentions {
	mentions: [];
	trackingType: string;
	theme: string;
}

const Mentions = React.memo(
	({ mentions, trackingType, theme }: IMessageBoxMentions) => {
		if (!trackingType) {
			return null;
		}
		return (
			<View testID='messagebox-container'>
				<FlatList
					style={[styles.mentionList, { backgroundColor: themes[theme].auxiliaryBackground }]}
					data={mentions}
					extraData={mentions}
					renderItem={({ item }) => <MentionItem item={item} trackingType={trackingType} theme={theme} />}
					keyExtractor={(item: any) => item.rid || item.name || item.command || item}
					keyboardShouldPersistTaps='always'
				/>
			</View>
		);
	},
	(prevProps, nextProps) => {
		if (prevProps.theme !== nextProps.theme) {
			return false;
		}
		if (prevProps.trackingType !== nextProps.trackingType) {
			return false;
		}
		if (!dequal(prevProps.mentions, nextProps.mentions)) {
			return false;
		}
		return true;
	}
);

export default Mentions;
