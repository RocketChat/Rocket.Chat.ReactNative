import { useMemo } from 'react';

import { type IUserMention, type IUserChannel } from '../interfaces';
import { parseMessage } from '../parseMessage';
import { buildRenderSegments, isBigEmojiOnly, type ISerializeContext, type TRenderSegment } from '../serialize';
import { useParseOptions } from './useParseOptions';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useCustomEmoji } from '~/lib/hooks/useCustomEmoji';
import useShortnameToUnicode from '~/lib/hooks/useShortnameToUnicode';
import { useUserPreferences } from '~/lib/methods/userPreferences';
import { USER_MENTIONS_PREFERENCES_KEY, ROOM_MENTIONS_PREFERENCES_KEY } from '~/lib/constants/keys';
import { getUserSelector } from '~/selectors/login';
import log from '~/lib/methods/helpers/log';

interface IUseMarkdownSegmentsParams {
	msg?: string | null;
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
	const parseOptions = useParseOptions();

	return useMemo(() => {
		if (!msg) {
			return NO_SEGMENTS;
		}

		try {
			const parsed = parseMessage(String(msg), parseOptions);
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
			return {
				segments: buildRenderSegments(parsed, serializeContext),
				bigEmojiOnly: isBigEmojiOnly(parsed, serializeContext)
			};
		} catch (error) {
			log(error);
			return NO_SEGMENTS;
		}
	}, [
		msg,
		parseOptions,
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
