export type TPipShare<Track> = { id: string; name?: string; isLocal: boolean; trackRef: Track };

export type TPipTile<Track> = { id: string; name: string; isSelf: boolean; hasCamera: boolean; cameraTrack?: Track };

export type TPipSource<Track> =
	| { kind: 'screen'; id: string; name: string; track: Track }
	| { kind: 'camera'; id: string; name: string; track: Track }
	| { kind: 'avatar'; id: string; name: string };

type TPipCandidates<Track> = {
	shares: TPipShare<Track>[];
	tiles: TPipTile<Track>[];
	activeSpeakerId: string | null;
};

const fromTile = <Track>({ id, name, hasCamera, cameraTrack }: TPipTile<Track>): TPipSource<Track> =>
	hasCamera && cameraTrack ? { kind: 'camera', id, name, track: cameraTrack } : { kind: 'avatar', id, name };

export const needsActiveSpeakerForPip = <Track>({ shares, tiles }: Pick<TPipCandidates<Track>, 'shares' | 'tiles'>): boolean =>
	!shares.some(({ isLocal }) => !isLocal) && tiles.filter(({ isSelf }) => !isSelf).length > 1;

export const pickPipSource = <Track>({
	shares,
	tiles,
	activeSpeakerId
}: TPipCandidates<Track>): TPipSource<Track> | undefined => {
	const remoteShare = shares.find(({ isLocal }) => !isLocal);
	if (remoteShare) {
		return { kind: 'screen', id: remoteShare.id, name: remoteShare.name ?? '', track: remoteShare.trackRef };
	}

	const remoteTiles = tiles.filter(({ isSelf }) => !isSelf);
	const speaker = remoteTiles.find(({ id }) => id === activeSpeakerId);
	const chosen = speaker ?? remoteTiles.find(({ hasCamera }) => hasCamera) ?? remoteTiles[0] ?? tiles[0];

	return chosen ? fromTile(chosen) : undefined;
};
