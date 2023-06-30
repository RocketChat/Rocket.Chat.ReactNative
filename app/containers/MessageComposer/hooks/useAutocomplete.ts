import { useEffect, useState } from 'react';

import { IAutocompleteItem, TAutocompleteType } from '../interfaces';
import { search } from '../../../lib/methods';

export const useAutocomplete = ({ text, type, rid }: { text: string; type: TAutocompleteType; rid: string }) => {
	const [items, setItems] = useState<IAutocompleteItem[]>([]);
	useEffect(() => {
		const getAutocomplete = async () => {
			if (type === '@' || type === '#') {
				const res = await search({ text, filterRooms: type === '#', filterUsers: type === '@', rid });
				console.log('🚀 ~ file: useAutocomplete.ts:12 ~ getAutocomplete ~ res:', res);
				const parsedRes = res.map(item => ({
					// @ts-ignore
					id: item._id || item.rid,
					// @ts-ignore
					title: item.fname || item.name || item.username,
					// @ts-ignore
					subtitle: item.username || item.name,
					// @ts-ignore
					outside: item.outside,
					// @ts-ignore
					t: item.t ?? 'd',
					// @ts-ignore
					status: item.status
				}));
				setItems(parsedRes);
			}
		};
		getAutocomplete();
	}, [text, type, rid]);
	return items;
};
