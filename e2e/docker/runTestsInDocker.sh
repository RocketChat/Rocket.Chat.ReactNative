#!/bin/bash
SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"
ROOT_FOLDER=${SCRIPTPATH%%/e2e*} #Gets path up to (but excluding) "e2e" - this assumes this script is always held within the e2e folder
PAUSE_ON_FAIL_FOR_DEBUG=0
FORCE_DEFAULT_DOCKER_DATA=0 # Set this to 1 to automatically overwrite data.js with the working Docker version

TEST_SUBSET="${1:-}"

function cleanup_and_exit () {
    "$SCRIPTPATH/controlRCDemoEnv.sh" stop
    exit $1
}

# INFRASTRUCTURE UP
"$SCRIPTPATH/controlRCDemoEnv.sh" startandwait

# RUN TESTS
echo "Running tests"

cd "$ROOT_FOLDER"
if [ $FORCE_DEFAULT_DOCKER_DATA == 1 ]; then
    cp "./e2e/data/data.docker.js" "./e2e/data.js"
fi
npx detox test "$ROOT_FOLDER/e2e/tests/$TEST_SUBSET" -c ios.sim.release
TEST_SUCCESS=$?
if [ $TEST_SUCCESS != 0 ] && [ $PAUSE_ON_FAIL_FOR_DEBUG == 1 ]; then
    read -n 1 -s -r -p "Paused for debugging failed tests. Press any key to continue." && echo
fi
cleanup_and_exit $TEST_SUCCESS


