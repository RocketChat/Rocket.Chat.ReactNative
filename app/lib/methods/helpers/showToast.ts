import { LISTENER } from '../../../containers/Toast';
import EventEmitter from '../../../utils/events';

export const showToast = (message: string): void => EventEmitter.emit(LISTENER, { message });
