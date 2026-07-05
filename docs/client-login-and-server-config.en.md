# Client Login, MUST_LOGIN, and Server Configuration Troubleshooting Guide

This guide is for administrators of RustDesk full-s6 / Web Admin deployments. It covers client login setup, checks before enabling `MUST_LOGIN`, and troubleshooting API Server, ID Server, Relay Server, and Key misconfiguration.

> Replace all example domains and addresses with your own deployment values. Do not commit private keys, JWT keys, admin passwords, or unredacted screenshots to a public repository.

## 1. Key concepts

### API Server

The API Server is used for client account login, WebAuth browser authorization, device reporting, and audit-log reporting. If it is misconfigured, the RustDesk client may not show the `webauth` login option, or login may fail with DNS, connection, or response-parsing errors.

### ID Server

The ID Server is the RustDesk rendezvous / hbbs address. A successful account login does not prove that the ID Server is correct. If the ID Server is wrong, devices may appear offline and connection attempts may fail during the rendezvous stage.

### Relay Server

The Relay Server is the hbbr address. Changing only the client-side Relay Server field is not always enough to create a relay failure. During negotiation, hbbs can return its server-configured relay address, so the client may still use the correct hbbr and connect successfully.

### Key

The Key must match the server public key. A wrong Key usually appears as a public-key or rendezvous-key handshake failure.

### MUST_LOGIN

`MUST_LOGIN` requires the client connection to carry a valid login token. In the current Web Admin, “Require client login” is applied through the hbbs runtime command `must-login` / `ml`:

- Query: `ml`
- Enable: `ml Y`
- Disable: `ml N`

This is runtime state. After the container or hbbs restarts, it falls back to the `MUST_LOGIN` environment default. Do not treat it as a database-persisted setting.

## 2. Checklist before enabling MUST_LOGIN

Before enabling it, complete these checks in order:

1. Copy the client import configuration from Web Admin → Profile → Server Connection Credentials.
2. Confirm that API Server, ID Server, Relay Server, and Key in the client match the current deployment.
3. Confirm that the RustDesk client account page shows the `webauth` login option.
4. Click `webauth` and complete Web Admin login plus authorization confirmation in the browser.
5. Confirm that the client receives a logged-in state.
6. Verify that an authenticated client can connect.
7. Verify that an unauthenticated client is rejected.
8. Enable `MUST_LOGIN` in production only after the above checks pass.

## 3. Verified behavior

The currently verified behavior is:

| Scenario | Client-visible result | Meaning |
| --- | --- | --- |
| `MUST_LOGIN=Y` + unauthenticated client | `LOGIN_REQUIRED` | hbbs rejects a connection without a valid login token. |
| `MUST_LOGIN=Y` + authenticated client | Connection succeeds | The token obtained through WebAuth / browser authorization is accepted by hbbs. |
| Wrong Key | invalid public key / public-key handshake failure | Server public key mismatch. |
| Wrong API Server | `webauth` disappears, or login fails with DNS/connect/parse errors | Client login and API discovery fail before hbbs connection gating. |
| Wrong ID Server | Account login may succeed, but devices appear offline or connection to ID Server fails | API login and hbbs rendezvous are separate paths. |
| Wrong client-side Relay Server only | Connection may still succeed | hbbs may return the correct server-configured relay during negotiation. |

Different RustDesk client versions and paths may display a generic connection failure, `Broken pipe`, `Key mismatch`, or other generalized errors. Use Web Admin, server logs, and the exact client version as the source of truth.

## 4. Common troubleshooting flows

### The client does not show the webauth login option

Check first:

1. Whether the API Server address is correct;
2. Whether the API Server is reachable from the client network;
3. Whether the API service is healthy;
4. Whether WebAuth / OIDC entries are returned by `/api/login-options`.

### The client can log in, but devices are offline or connection fails

Check first:

1. Whether the ID Server is correct;
2. Whether the Key is correct;
3. Whether hbbs ports are reachable;
4. Whether the client device has reported successfully;
5. Whether Web Admin device and connection-log pages show related records.

### An unauthenticated client can still connect after MUST_LOGIN is enabled

Confirm first:

1. Whether `ml` in Web Admin returns `MUST_LOGIN: true`;
2. Whether the connecting client has already signed in;
3. Whether hbbs and API share the same `RUSTDESK_API_JWT_KEY`;
4. Whether the client is connecting to an old service, old container, or another hbbs instance.

### The client-side Relay Server is wrong but connection still works

This is not necessarily a bug. hbbs can return the server-configured relay in negotiation messages such as `FetchLocalAddr`, `PunchHole`, and `RelayResponse`. To validate a real relay failure, do not rely on the client field alone. Use an isolated environment:

1. Point hbbs relay configuration at a bad hbbr address in an isolated full-s6 stack; or
2. Block the client from reaching the real hbbr endpoint; or
3. Force relay and stop/block hbbr in an isolated environment; and
4. Check hbbr logs for `New relay request`, `got paired`, and `Relay of ... closed`.

Do not casually modify server-side relay configuration on a shared test host or production host unless you have a backup and rollback window.

## 5. Administration guidance

- Keep the Web Admin panel focused on current state, key risk warnings, and links to documentation. Treat this document as the detailed operating guide.
- Do not change the default to `MUST_LOGIN=Y` just because one validation passed. Defaults and persistence policy should be designed separately.
- After changing `MUST_LOGIN`, record the runtime state and restore it according to the shared test-environment agreement.
- Redact domains, IP addresses, keys, tokens, passwords, and personal account identifiers before sharing screenshots or public documentation.
