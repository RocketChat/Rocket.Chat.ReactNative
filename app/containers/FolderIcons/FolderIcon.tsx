import Svg, { Path } from 'react-native-svg';

const FolderIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
	<Svg width={size} height={size} viewBox='0 0 24 24' fill='none'>
		<Path
			fillRule='evenodd'
			clipRule='evenodd'
			d='M14.7502 4.5C14.4257 4.5 14.1097 4.60556 13.8501 4.80029L11.6499 6.44971C11.4228 6.62007 11.1527 6.72204 10.8713 6.74487L10.7498 6.75L4.5 6.75C3.67158 6.75 3 7.42157 3 8.25L3 18C3 18.8284 3.67157 19.5 4.5 19.5L19.5 19.5C20.3284 19.5 21 18.8284 21 18L21 6C21 5.22326 20.4096 4.58475 19.6531 4.50806L19.5 4.5L14.7502 4.5ZM19.5 18L4.5 18L4.5 8.25L10.7498 8.25C11.3989 8.25 12.0308 8.03959 12.5501 7.65015L14.7502 6L19.5 6L19.5 18Z'
			fill={color}
		/>
	</Svg>
);

export default FolderIcon;
