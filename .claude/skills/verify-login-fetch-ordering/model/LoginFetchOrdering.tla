---------------------------- MODULE LoginFetchOrdering ----------------------------
(***************************************************************************)
(* handleLoginSuccess (app/sagas/login.js) fetches permissions and         *)
(* enterprise modules, and startVoipFork re-runs checkVoipPermission when   *)
(* PERMISSIONS.SET or ENTERPRISE_MODULES.SET lands. Mode picks how the two  *)
(* fetches run: "sequential" (one call after the other, the code before    *)
(* the parallel change) or "parallel" (yield all([...]), the code now).     *)
(*                                                                         *)
(* One step = one JS task: everything between two I/O completions (a REST *)
(* or DDP reply, a WatermelonDB read or write) runs to completion, with    *)
(* its microtasks, before the next I/O completion. AtomicCheck = TRUE says *)
(* checkVoipPermission has no I/O await, so a check runs inside the task   *)
(* that dispatched the action that triggered it.                           *)
(***************************************************************************)
EXTENDS Naturals, Sequences

CONSTANTS Mode, AtomicCheck

VARIABLES
    perms,            \* redux state.permissions grants allow-internal/external-voice-calls to the user's roles
    voipModule,       \* redux state.enterpriseModules includes 'teams-voip'
    modulesOwner,     \* which workspace the redux enterpriseModules came from
    session,          \* mediaSessionStore.getCurrentInstance() is set
    serverPerms,      \* what permissions.listAll will answer
    serverModule,     \* what licenses.info will answer about teams-voip
    licenseAnswered,  \* FALSE: fetchLicenseState returns undefined -> clearEnterpriseModules()
    saga,             \* handleLoginSuccess program counter
    voipFork,         \* startVoipFork program counter
    initialSnap,      \* perms read by the initial checkVoipPermission (used when ~AtomicCheck)
    checks,           \* perms snapshots of in-flight takeLatest checks (used when ~AtomicCheck)
    permsPc,          \* getPermissions program counter
    setPermsPc,       \* setPermissions() fired without await from getPermissions
    modsPc,           \* getEnterpriseModules program counter
    switched,         \* a SERVER.SELECT_REQUEST cancelled handleLoginSuccess
    newModsPc,        \* the new workspace's setEnterpriseModules() in handleSelectServer
    start             \* ghost: <<perms, voipModule, session>> when handleLoginSuccess began

vars == <<perms, voipModule, modulesOwner, session, serverPerms, serverModule, licenseAnswered,
          saga, voipFork, initialSnap, checks, permsPc, setPermsPc, modsPc, switched, newModsPc, start>>

\* checkVoipPermission: canUseVoip = isVoipModuleAvailable() && (hasPermissions[0] || hasPermissions[1]);
\* init() when allowed, reset() when not (no active call during login is assumed).
Decide(p, m) == p /\ m

Init ==
    /\ perms \in BOOLEAN
    /\ voipModule \in BOOLEAN
    /\ modulesOwner = "old"
    /\ session \in BOOLEAN
    /\ serverPerms \in BOOLEAN
    /\ serverModule \in BOOLEAN
    /\ licenseAnswered \in BOOLEAN
    /\ saga = "spawnVoip"
    /\ voipFork = "notSpawned"
    /\ initialSnap = FALSE
    /\ checks = <<>>
    /\ permsPc = "idle"
    /\ setPermsPc = "idle"
    /\ modsPc = "idle"
    /\ switched = FALSE
    /\ newModsPc = "idle"
    /\ start = <<perms, voipModule, session>>

\* A dispatch of PERMISSIONS.SET / ENTERPRISE_MODULES.SET while takeLatest listens.
Recheck(p, m) ==
    IF voipFork = "listening"
    THEN IF AtomicCheck
         THEN /\ session' = Decide(p, m) /\ UNCHANGED checks
         ELSE /\ checks' = Append(checks, p) /\ UNCHANGED session
    ELSE UNCHANGED <<session, checks>>

\* login.js handleLoginSuccess: yield spawn(startVoipFork); then the two fetches.
SpawnVoipAndStartFetches ==
    /\ saga = "spawnVoip"
    /\ IF AtomicCheck
       THEN /\ session' = Decide(perms, voipModule) /\ voipFork' = "listening" /\ UNCHANGED initialSnap
       ELSE /\ initialSnap' = perms /\ voipFork' = "initialCheck" /\ UNCHANGED session
    /\ permsPc' = "dbRead"
    /\ IF Mode = "sequential"
       THEN /\ saga' = "awaitPerms" /\ UNCHANGED modsPc
       ELSE /\ saga' = "awaitBoth" /\ modsPc' = "net"
    /\ UNCHANGED <<perms, voipModule, modulesOwner, serverPerms, serverModule, licenseAnswered,
                   checks, setPermsPc, switched, newModsPc, start>>

\* startVoipFork: yield call(checkVoipPermission) returns, then race({ recheck: takeLatest(...) }).
FinishInitialCheck ==
    /\ ~AtomicCheck
    /\ voipFork = "initialCheck"
    /\ session' = Decide(initialSnap, voipModule)
    /\ voipFork' = IF switched THEN "stopped" ELSE "listening"
    /\ UNCHANGED <<perms, voipModule, modulesOwner, serverPerms, serverModule, licenseAnswered,
                   saga, initialSnap, checks, permsPc, setPermsPc, modsPc, switched, newModsPc, start>>

\* A takeLatest check finishing after its I/O await. Cancelling the saga task does not stop the async function.
FinishCheck(i) ==
    /\ ~AtomicCheck
    /\ session' = Decide(checks[i], voipModule)
    /\ checks' = SubSeq(checks, 1, i - 1) \o SubSeq(checks, i + 1, Len(checks))
    /\ UNCHANGED <<perms, voipModule, modulesOwner, serverPerms, serverModule, licenseAnswered,
                   saga, voipFork, initialSnap, permsPc, setPermsPc, modsPc, switched, newModsPc, start>>

\* getPermissions.ts getPermissions: permissionsCollection.query().fetch() completes.
PermsDbRead ==
    /\ permsPc = "dbRead"
    /\ permsPc' = "net"
    /\ UNCHANGED <<perms, voipModule, modulesOwner, session, serverPerms, serverModule, licenseAnswered,
                   saga, voipFork, initialSnap, checks, setPermsPc, modsPc, switched, newModsPc, start>>

\* sdk.get('permissions.listAll') answers.
PermsNet ==
    /\ permsPc = "net"
    /\ permsPc' = "dbWrite"
    /\ UNCHANGED <<perms, voipModule, modulesOwner, session, serverPerms, serverModule, licenseAnswered,
                   saga, voipFork, initialSnap, checks, setPermsPc, modsPc, switched, newModsPc, start>>

\* updatePermissions writes; if anything changed, setPermissions() is fired without await, then resolve().
PermsDbWrite ==
    /\ permsPc = "dbWrite"
    /\ permsPc' = "done"
    /\ setPermsPc' = IF serverPerms # perms THEN "query" ELSE "done"
    /\ UNCHANGED <<perms, voipModule, modulesOwner, session, serverPerms, serverModule, licenseAnswered,
                   saga, voipFork, initialSnap, checks, modsPc, switched, newModsPc, start>>

\* setPermissions: query completes, then dispatch(setPermissionsAction) -> PERMISSIONS.SET.
SetPermissionsDispatch ==
    /\ setPermsPc = "query"
    /\ setPermsPc' = "done"
    /\ perms' = serverPerms
    /\ Recheck(serverPerms, voipModule)
    /\ UNCHANGED <<voipModule, modulesOwner, serverPerms, serverModule, licenseAnswered,
                   saga, voipFork, initialSnap, permsPc, modsPc, switched, newModsPc, start>>

\* enterpriseModules.ts getEnterpriseModules: fetchLicenseState answers.
\* Undefined -> clearEnterpriseModules() (ENTERPRISE_MODULES.CLEAR, which takeLatest does not watch).
ModsNet ==
    /\ modsPc = "net"
    /\ IF licenseAnswered
       THEN /\ modsPc' = "dbFind" /\ UNCHANGED <<voipModule, modulesOwner>>
       ELSE /\ modsPc' = "done" /\ voipModule' = FALSE /\ modulesOwner' = "old"
    /\ UNCHANGED <<perms, session, serverPerms, serverModule, licenseAnswered,
                   saga, voipFork, initialSnap, checks, permsPc, setPermsPc, switched, newModsPc, start>>

\* serversDB.get('servers').find(serverId) completes.
ModsDbFind ==
    /\ modsPc = "dbFind"
    /\ modsPc' = "dbWrite"
    /\ UNCHANGED <<perms, voipModule, modulesOwner, session, serverPerms, serverModule, licenseAnswered,
                   saga, voipFork, initialSnap, checks, permsPc, setPermsPc, switched, newModsPc, start>>

\* serversDB.write completes, then dispatch(setEnterpriseModulesAction) -> ENTERPRISE_MODULES.SET.
ModsDbWriteDispatch ==
    /\ modsPc = "dbWrite"
    /\ modsPc' = "done"
    /\ voipModule' = serverModule
    /\ modulesOwner' = "old"
    /\ Recheck(perms, serverModule)
    /\ UNCHANGED <<perms, serverPerms, serverModule, licenseAnswered,
                   saga, voipFork, initialSnap, permsPc, setPermsPc, switched, newModsPc, start>>

\* sequential: yield call(fetchPermissions) returns, then yield call(fetchEnterpriseModules) starts.
SequentialPermsReturn ==
    /\ saga = "awaitPerms"
    /\ permsPc = "done"
    /\ saga' = "awaitMods"
    /\ modsPc' = "net"
    /\ UNCHANGED <<perms, voipModule, modulesOwner, session, serverPerms, serverModule, licenseAnswered,
                   voipFork, initialSnap, checks, permsPc, setPermsPc, switched, newModsPc, start>>

SagaContinues ==
    /\ \/ saga = "awaitMods" /\ modsPc = "done"
       \/ saga = "awaitBoth" /\ permsPc = "done" /\ modsPc = "done"
    /\ saga' = "after"
    /\ UNCHANGED <<perms, voipModule, modulesOwner, session, serverPerms, serverModule, licenseAnswered,
                   voipFork, initialSnap, checks, permsPc, setPermsPc, modsPc, switched, newModsPc, start>>

\* login.js root(): SERVER.SELECT_REQUEST within 2s cancels handleLoginSuccess; startVoipFork's race stops.
\* Promises already started keep running; saga steps not yet started never run.
SwitchWorkspace ==
    /\ ~switched
    /\ saga \in {"awaitPerms", "awaitMods", "awaitBoth"}
    /\ switched' = TRUE
    /\ saga' = "cancelled"
    /\ voipFork' = IF voipFork = "listening" THEN "stopped" ELSE voipFork
    /\ newModsPc' = "dbFind"
    /\ UNCHANGED <<perms, voipModule, modulesOwner, session, serverPerms, serverModule, licenseAnswered,
                   initialSnap, checks, permsPc, setPermsPc, modsPc, start>>

\* selectServer.ts handleSelectServer: setEnterpriseModules() reads the new workspace's server record and dispatches.
NewWorkspaceModulesDispatch ==
    /\ newModsPc = "dbFind"
    /\ newModsPc' = "done"
    /\ modulesOwner' = "new"
    /\ voipModule' \in BOOLEAN
    /\ UNCHANGED <<perms, session, serverPerms, serverModule, licenseAnswered,
                   saga, voipFork, initialSnap, checks, permsPc, setPermsPc, modsPc, switched, start>>

Quiescent ==
    /\ saga \in {"after", "cancelled"}
    /\ permsPc \notin {"dbRead", "net", "dbWrite"}
    /\ setPermsPc # "query"
    /\ modsPc \notin {"net", "dbFind", "dbWrite"}
    /\ newModsPc # "dbFind"
    /\ voipFork # "initialCheck"
    /\ checks = <<>>

Next ==
    \/ SpawnVoipAndStartFetches
    \/ FinishInitialCheck
    \/ \E i \in 1..Len(checks) : FinishCheck(i)
    \/ PermsDbRead
    \/ PermsNet
    \/ PermsDbWrite
    \/ SetPermissionsDispatch
    \/ ModsNet
    \/ ModsDbFind
    \/ ModsDbWriteDispatch
    \/ SequentialPermsReturn
    \/ SagaContinues
    \/ SwitchWorkspace
    \/ NewWorkspaceModulesDispatch
    \/ Quiescent /\ UNCHANGED vars

Spec == Init /\ [][Next]_vars


\* Once login settles, the VoIP media session exists exactly when the user may place calls.
VoipSessionMatchesAccess ==
    (Quiescent /\ ~switched /\ licenseAnswered) => (session = Decide(perms, voipModule))

\* What the regression comparison reads at quiescence: the inputs, then every value the flow writes.
Outcome == <<start, serverPerms, serverModule, licenseAnswered, perms, voipModule, modulesOwner, session, switched>>
=============================================================================
