import { useMemo } from 'react';
import { type Root } from '@rocket.chat/message-parser';

import { type IUserMention, type IUserChannel } from '../interfaces';
import { buildRenderSegments, isBigEmojiOnly, type ISerializeContext, type TRenderSegment } from '../serialize';
import { toPlainTextRoot } from '../toPlainTextRoot';
import { useMessageRoot } from './useMessageRoot';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useCustomEmoji } from '~/lib/hooks/useCustomEmoji';
import useShortnameToUnicode from '~/lib/hooks/useShortnameToUnicode';
import { useUserPreferences } from '~/lib/methods/userPreferences';
import { USER_MENTIONS_PREFERENCES_KEY, ROOM_MENTIONS_PREFERENCES_KEY } from '~/lib/constants/keys';
import { getUserSelector } from '~/selectors/login';
import log from '~/lib/methods/helpers/log';

interface IUseMarkdownSegmentsParams {
	msg: string;
	md?: Root;
	mentions?: IUserMention[];
	channels?: IUserChannel[];
	useRealName?: boolean;
	username: string;
}

interface IMarkdownSegments {
	segments: TRenderSegment[];
	bigEmojiOnly: boolean;
}

const NO_SEGMENTS: IMarkdownSegments = { segments: [], bigEmojiOnly: false };

export const useMarkdownSegments = ({
	msg,
	md,
	mentions,
	channels,
	useRealName,
	username
}: IUseMarkdownSegmentsParams): IMarkdownSegments => {
	const baseUrl = useAppSelector(state => state.server.server);
	const convertAsciiEmoji = useAppSelector(state => getUserSelector(state)?.settings?.preferences?.convertAsciiEmoji ?? false);
	const getCustomEmoji = useCustomEmoji();
	const { formatShortnameToUnicode } = useShortnameToUnicode();
	const [mentionsWithAtSymbol] = useUserPreferences<boolean>(USER_MENTIONS_PREFERENCES_KEY, false);
	const [roomsWithHashTagSymbol] = useUserPreferences<boolean>(ROOM_MENTIONS_PREFERENCES_KEY, false);
	const root = useMessageRoot(msg, md);

	return useMemo(() => {
		if (!root) {
			return NO_SEGMENTS;
		}

		const serializeContext: ISerializeContext = {
			mentions,
			channels,
			useRealName,
			username,
			mentionsWithAtSymbol: mentionsWithAtSymbol ?? false,
			roomsWithHashTagSymbol: roomsWithHashTagSymbol ?? false,
			getCustomEmoji,
			baseUrl,
			convertAsciiEmoji,
			formatShortnameToUnicode
		};

		try {
			return {
				segments: buildRenderSegments(root, serializeContext),
				bigEmojiOnly: isBigEmojiOnly(root, serializeContext)
			};
		} catch (error) {
			log(error);
			return { segments: buildRenderSegments(toPlainTextRoot(msg), serializeContext), bigEmojiOnly: false };
		}
	}, [
		root,
		msg,
		mentions,
		channels,
		useRealName,
		username,
		mentionsWithAtSymbol,
		roomsWithHashTagSymbol,
		getCustomEmoji,
		baseUrl,
		convertAsciiEmoji,
		formatShortnameToUnicode
	]);
};
