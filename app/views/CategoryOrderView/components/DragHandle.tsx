import Svg, { Circle } from 'react-native-svg';

export const DRAG_HANDLE_SIZE = 24;

const DOT_COLUMNS = [6.01, 12.01, 18.01];
const DOT_ROWS = [9, 15];

const DragHandle = ({ color }: { color: string }) => (
	<Svg width={DRAG_HANDLE_SIZE} height={DRAG_HANDLE_SIZE} viewBox='0 0 24 24'>
		{DOT_ROWS.flatMap(cy => DOT_COLUMNS.map(cx => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.5} fill={color} />))}
	</Svg>
);

export default DragHandle;
