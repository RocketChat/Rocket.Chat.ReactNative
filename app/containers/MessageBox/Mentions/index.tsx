import React from 'react';
import { FlatList, View } from 'react-native';
import { dequal } from 'dequal';

import MentionHeaderList from './MentionHeaderList';
import styles from '../styles';
import MentionItem from './MentionItem';
import { themes } from '../../../constants/colors';

interface IMessageBoxMentions {
	mentions: any[];
	trackingType: string;
	theme: string;
	loading: boolean;
}

const Mentions = React.memo(
	({ mentions, trackingType, theme, loading }: IMessageBoxMentions) => {
		if (!trackingType) {
			return null;
		}
		return (
			<View testID='messagebox-container'>
				<FlatList
					style={[styles.mentionList, { backgroundColor: themes[theme].auxiliaryBackground }]}
					ListHeaderComponent={() => (
						<MentionHeaderList trackingType={trackingType} hasMentions={mentions.length > 0} theme={theme} loading={loading} />
					)}
					data={mentions}
					extraData={mentions}
					renderItem={({ item }) => <MentionItem item={item} trackingType={trackingType} theme={theme} />}
					keyExtractor={item => item.rid || item.name || item.command || item.shortcut || item}
					keyboardShouldPersistTaps='always'
				/>
			</View>
		);
	},
	(prevProps, nextProps) => {
		if (prevProps.loading !== nextProps.loading) {
			return false;
		}
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
