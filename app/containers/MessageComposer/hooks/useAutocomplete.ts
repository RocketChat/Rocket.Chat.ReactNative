import { useEffect, useState } from 'react';

import { TAutocompleteType } from '../interfaces';
import { search } from '../../../lib/methods';

export const useAutocomplete = ({ text, type, rid }: { text: string; type: TAutocompleteType; rid: string }) => {
	const [items, setItems] = useState([
		{
			username: 'test',
			name: 'test',
			id: 'test'
		},
		{
			username: 'diego.mello',
			name: 'Diego Mello',
			id: 'dm'
		},
		{
			username: 'rocket.cat',
			name: 'Rocket Cat',
			id: 'gato'
		}
	]);
	// useEffect(() => {
	// 	const getAutocomplete = async () => {
	// 		if (type === '@') {
	// 			const res = await search({ text, filterRooms: false, filterUsers: true, rid });
	// 			setItems(res);
	// 		}
	// 	};
	// 	getAutocomplete();
	// }, [text, type, rid]);
	return items;
};
