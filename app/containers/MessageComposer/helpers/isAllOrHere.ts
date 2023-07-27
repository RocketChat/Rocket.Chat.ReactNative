import { TAutocompleteItem } from '../interfaces';

export const isAllOrHere = (item: TAutocompleteItem) => item.id === 'all' || item.id === 'here';
