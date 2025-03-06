import { TAutocompleteItem } from '../interfaces';

export const fetchIsAllOrHere = (item: TAutocompleteItem) => item.id === 'all' || item.id === 'here';
