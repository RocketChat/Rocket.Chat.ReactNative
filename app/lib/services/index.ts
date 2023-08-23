import * as connect from './connect';
import * as restApi from './restApi';
import { getServerInfo } from './getServerInfo';

export const Services = {
	...connect,
	...restApi,
	getServerInfo
};
