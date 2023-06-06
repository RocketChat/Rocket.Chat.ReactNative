if [ -z "$1" ] || [ -z "$2" ]
	then
		echo "sh ./flashlight-runner.sh <bundleId> <testCommand> <duration(optional)>"
		exit 1
fi

# removes .yml from the test command
TEST_COMMAND="${2/.yml}"

# creates the results folder if it doesn't exist
mkdir -p ./results/$TEST_COMMAND

# updates the bundleId in the test file
sed -i '' "s/appId: .*/appId: $1/g" $2

DURATION=$3
# if no duration, don't use it
if [ -z "$3" ]
	then
		DURATION=0
fi

# runs the test
flashlight test --bundleId $1 --testCommand "maestro test $2" --resultsTitle "$TEST_COMMAND, $1" --resultsFilePath "./results/$TEST_COMMAND/$1.json" --record --duration $DURATION