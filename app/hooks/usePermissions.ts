/* eslint-disable @typescript-eslint/indent */
import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { TSupportedPermissions } from '../reducers/permissions';
import { IApplicationState } from '../definitions'
import { getUserSelector } from '../selectors/login';
import { hasPermission } from '../lib/methods';

function usePermissions(permissions: TSupportedPermissions[], rid?: string) {
    const [permissionsState, setPermissionsState] = useState<boolean[]>([])

    const permissionsRedux = useSelector((state: IApplicationState) => state.permissions)
    const userRoles = useSelector((state: IApplicationState) => getUserSelector(state).roles)

    console.log(permissions, permissionsState, permissionsRedux, userRoles)
    console.count('usePermissions')

    const haspermissions = async (perms: (string[] | undefined)[]) => {
        console.log("🚀 ~ file: usePermissions.ts ~ line 19 ~ haspermissions ~ perms", perms)

        const result = await hasPermission(perms)
        console.log("🚀 ~ file: usePermissions.ts ~ line 20 ~ haspermissions ~ result", result)
        setPermissionsState(result)
    }

    useEffect(() => {
        if (permissionsRedux) {
            const array: (string[] | undefined)[] = []
            permissions.forEach(p => array.push(permissionsRedux[p]))
            haspermissions(array)
        }
    }, [userRoles, permissionsRedux])


    return permissionsState

}

export default usePermissions