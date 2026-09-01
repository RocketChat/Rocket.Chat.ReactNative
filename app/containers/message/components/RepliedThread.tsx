import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { CustomIcon } from '../../CustomIcon';
import styles from '../styles';
import I18n from '../../../i18n';
import { MarkdownPreview } from '../../markdown';
import { type IMessageRepliedThread } from '../interfaces';
import { useTheme } from '../../../theme';
import { AvatarContainer } from './MessageAvatar';
import { useFetchThreadName } from '../stores/MessageRoomStore';
import { useIsEncrypted, useRepliedThreadData } from '../stores/MessageStore';

const RepliedThread = ({ isHeader }: IMessageRepliedThread) => {
	const { colors } = useTheme();
	const fetchThreadName = useFetchThreadName();
	const { tmid, tmsg, id } = useRepliedThreadData();
	const isEncrypted = useIsEncrypted();
	const displayMsg = isEncrypted ? I18n.t('Encrypted_message') : tmsg;
	const [fetchedName, setFetchedName] = useState<string | undefined>();

	useEffect(() => {
		if (displayMsg || !tmid || !fetchThreadName) {
			return;
		}
		let ignore = false;
		fetchThreadName(tmid, id)
			.then(threadName => {
				if (!ignore) {
					setFetchedName(threadName ?? '');
				}
			})
			.catch(() => {
				if (!ignore) {
					setFetchedName('');
				}
			});
		return () => {
			ignore = true;
		};
	}, [tmid, id, displayMsg, fetchThreadName]);

	if (!tmid || !isHeader) {
		return null;
	}

	const isFetchingName = !!fetchThreadName && !displayMsg && fetchedName === undefined;

	if (isFetchingName) {
		return null;
	}

	const msg = displayMsg || fetchedName || I18n.t('Thread');

	return (
		<View style={styles.repliedThread} testID={`message-thread-replied-on-${msg}`}>
			<AvatarContainer>
				<CustomIcon name='threads' size={20} color={colors.fontInfo} />
			</AvatarContainer>
			<MarkdownPreview msg={msg} style={[styles.repliedThreadName, { color: colors.fontInfo }]} />
			<View style={styles.repliedThreadDisclosure}>
				<CustomIcon name='chevron-right' color={colors.fontSecondaryInfo} size={20} />
			</View>
		</View>
	);
};

export default RepliedThread;
