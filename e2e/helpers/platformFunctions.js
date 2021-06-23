const { exec } = require('child_process');
const { device } = require('detox');
const { sleep } = require('./app');

const defaultLaunchArgs = { permissions: { notifications: 'YES' } };

function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if(error)
            {
                reject(new Error(`exec error: ${stderr}`));
                return;
            }
            resolve();
        })
    });
}

exports.launchWithLanguage = async (language, countryCode="US", launchArgs=defaultLaunchArgs) => {
    if(device.id === undefined)
    {    
        await device.launchApp(launchArgs);
    }
    if(device.getPlatform() === 'android')
    {
        await runCommand('adb root');
        await runCommand(`adb shell "setprop persist.sys.locale ${language}-${countryCode}; setprop ctl.restart zygote"`);
        await sleep(5000);
        await device.launchApp(launchArgs);
    }
    else
    {
        const langLocale = typeof countryCode === 'string' ? `${language}-${countryCode}` : language;
        await device.launchApp({
            ...launchArgs,
            languageAndLocale: {
                language: langLocale,
                locale: langLocale
            }
        });
    }
}