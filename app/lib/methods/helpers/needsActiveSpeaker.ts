import { needsActiveSpeakerForPip, type TPipShare, type TPipTile } from './pickPipSource';
import { MAX_VISIBLE_TILES } from './splitByPriority';

interface INeedsActiveSpeaker<Track> {
	shares: TPipShare<Track>[];
	tiles: TPipTile<Track>[];
	gridLayout: boolean;
	expanded: boolean;
}

export const needsActiveSpeaker = <Track>({ shares, tiles, gridLayout, expanded }: INeedsActiveSpeaker<Track>): boolean =>
	tiles.length > MAX_VISIBLE_TILES || !gridLayout || (expanded && needsActiveSpeakerForPip({ shares, tiles }));
