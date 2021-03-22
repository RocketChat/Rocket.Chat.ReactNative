import rootReducer from '../reducers';

export interface IStateReducer extends ReturnType<typeof rootReducer> {}