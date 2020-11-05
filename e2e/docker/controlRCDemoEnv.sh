#!/bin/bash
SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"

PAUSE_ON_FAIL_FOR_DEBUG=0

COMMAND="start"
if [ "$1" != "" ]; then
    if [[ "$1" =~ ^(start|startandwait|stop)$ ]]; then
        COMMAND=$1
    else
        echo "Invalid command. Must be one of: start,stop"
        exit 1
    fi
fi

WAIT=0
if [ "$COMMAND" == "startandwait" ]; then
    COMMAND="start"
    WAIT=1
fi

COMPOSEPATH="$SCRIPTPATH/rc_test_env"
export DATAROOT="$SCRIPTPATH"

if [ "$COMMAND" == "start" ]; then
    echo "Fetching infrastructure config from GitHub"
    COMPOSEURL=https://raw.githubusercontent.com/RocketChat/Rocket.Chat/develop/docker-compose.yml
    COMPOSEFILE="$COMPOSEPATH/docker-compose.yml"
    curl -s "$COMPOSEURL" -o "$COMPOSEFILE"
    
    echo "Starting infrastructure"
    (
        if [ -d "$SCRIPTPATH/data/db" ]; then rm -rf "$SCRIPTPATH/data/db"; fi
        cd "$COMPOSEPATH"
        docker-compose up -d
    )

    if [ $WAIT == 1 ]; then
        echo "Waiting for RocketChat to be ready"

        ATTEMPT_NUMBER=0
        MAX_ATTEMPTS=60
        while [ $ATTEMPT_NUMBER -lt $MAX_ATTEMPTS ]; do # https://stackoverflow.com/a/21189312/399007
            ATTEMPT_NUMBER=$((ATTEMPT_NUMBER + 1 ))
            echo "Checking if servers are ready (attempt $ATTEMPT_NUMBER of $MAX_ATTEMPTS)"
            LOGS=$(docker logs rc_test_env_rocketchat_1  2> /dev/null)
            if grep -q 'SERVER RUNNING' <<< $LOGS ; then
                echo "RocketChat is ready!"
                break
            else
                if [ $ATTEMPT_NUMBER == $MAX_ATTEMPTS ]; then
                    echo "RocketChat failed to start"
                    if [ $PAUSE_ON_FAIL_FOR_DEBUG == 1 ]; then
                        read -n 1 -s -r -p "Press any key to tear down infrastructure." && echo
                    fi
                    docker-compose down --volumes
                    exit 1
                fi
            fi
            sleep 4
        done
    fi
fi

if [ "$COMMAND" == "stop" ]; then
    (
        cd "$COMPOSEPATH"
        docker-compose down --volumes
    )
fi