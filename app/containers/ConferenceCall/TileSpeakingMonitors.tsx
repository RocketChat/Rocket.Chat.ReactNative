import { type ReactElement } from 'react';

import { MAX_VISIBLE_TILES } from '~/lib/methods/helpers/splitByPriority';
import TileSpeakingMonitor from './TileSpeakingMonitor';
import { type IConferenceTile } from './useConferenceTiles';

interface ITileSpeakingMonitors {
	tiles: IConferenceTile[];
	expanded: boolean;
	onChange: (identity: string, speaking: boolean) => void;
}

const TileSpeakingMonitors = ({ tiles, expanded, onChange }: ITileSpeakingMonitors): ReactElement | null => {
	if (!expanded || tiles.length > MAX_VISIBLE_TILES) {
		return null;
	}

	return (
		<>
			{tiles.map(tile => (
				<TileSpeakingMonitor
					key={tile.id}
					identity={tile.id}
					trackRef={tile.muted ? undefined : tile.micTrack}
					onChange={onChange}
				/>
			))}
		</>
	);
};

export default TileSpeakingMonitors;
