import { combineReducers } from 'redux';
import * as reducers from './reducers';
import login from './login';
import meteor from './connect';
import messages from './messages';

console.log(Object.keys({
	...reducers, login, meteor, messages
}));
export default combineReducers({
	...reducers, login, meteor, messages
});
