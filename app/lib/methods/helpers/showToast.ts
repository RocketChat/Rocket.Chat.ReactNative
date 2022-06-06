import { LISTENER } from '../../../containers/Toast';
import EventEmitter from './events';

export const showToast = (message: string): void => EventEmitter.emit(LISTENER, { message });
