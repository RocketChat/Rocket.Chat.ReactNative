import 'react-native/Libraries/Lists/FlatList';

declare module 'react-native/Libraries/Lists/FlatList' {
	interface FlatListProps<ItemT> {
		strictMode?: boolean;
	}
}
