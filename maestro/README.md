This readme provides instructions on how to run the `flashlight-runner.sh` shell script. The script is designed to execute tests using the Flashlight testing framework.

### Prerequisites
- Flashlight framework installed on your system

### Usage
To run the `flashlight-runner.sh` script, use the following command:

```
cd maestro
sh ./flashlight-runner.sh <bundleId> <testCommand> <duration(optional)>
```

### Example
Here's an example command to run the script:

```
sh ./flashlight-runner.sh chat.rocket.reactnative tti.yml 3000
```

### Result Output
The script will create a results folder if it doesn't already exist, using the name of the test command (with `.yml` removed) as the folder name. The results of the test will be saved as a JSON file within this folder. The file will be named `<bundleId>.json`, where `<bundleId>` is the ID of the bundle or application being tested.

For example, if the test command is `test_command.yml` and the bundle ID is `com.example.app`, the results file will be saved as `./results/test_command/com.example.app.json`.

In order to see results, you can run the following command:

```
flashlight report ./results/test_command
```

### Updating the Test File
Before running the test, the script will update the `appId` field in the test file specified by `<testCommand>`. It replaces the existing `appId` value with the provided `<bundleId>`. Make sure the test file contains an `appId` field that needs to be updated.