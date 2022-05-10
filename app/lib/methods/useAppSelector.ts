import { TypedUseSelectorHook, useSelector } from 'react-redux';

import { IApplicationState } from '../../definitions';

const useAppSelector: TypedUseSelectorHook<IApplicationState> = useSelector;

export default useAppSelector;
