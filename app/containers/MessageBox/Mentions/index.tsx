import React from 'react';
import { FlatList, View } from 'react-native';
import { dequal } from 'dequal';

import MentionHeaderList from './MentionHeaderList';
import styles from '../styles';
import MentionItem from './MentionItem';
import { themes } from '../../../lib/constants';
import { useTheme } from '../../../theme';

interface IMessageBoxMentions {
	mentions: any[];
	trackingType: string;
	loading: boolean;
}

const Mentions = React.memo(
	({ mentions, trackingType, loading }: IMessageBoxMentions) => {
		const { theme } = useTheme();

		if (!trackingType) {
			return null;
		}

		return (
			<View testID='messagebox-container'>
				<FlatList
					style={[styles.mentionList, { backgroundColor: themes[theme].auxiliaryBackground }]}
					ListHeaderComponent={() => (
						<MentionHeaderList trackingType={trackingType} hasMentions={mentions.length > 0} loading={loading} />
					)}
					data={mentions}
					extraData={mentions}
					renderItem={({ item }) => <MentionItem item={item} trackingType={trackingType} />}
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
