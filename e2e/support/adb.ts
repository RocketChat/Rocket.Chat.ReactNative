import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const runCommand = promisify(execFile);

const androidSerial = () => process.env.E2E_ANDROID_DEVICE ?? 'emulator-5554';

export const adb = (...args: string[]) => runCommand('adb', ['-s', androidSerial(), ...args]);
