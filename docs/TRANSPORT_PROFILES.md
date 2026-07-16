# Transport Profile Boundary

Frontend facades select `application/fhir+json`, demo-only `application/didcomm-plain+json`, or protected `application/x-www-form-urlencoded` (`request=<JWE>`, `response=<JWE>`).

FHIR `Communication` uses `Bundle.id` as its only thread id. The frontend must surface GW `OperationOutcome` entries verbatim after submit/poll. The portal is online-first; SOSChain owns encrypted offline persistence and replay.

## Direct Expo/browser runtime

`FrontClinicalRuntimeClient` exposes the same actor-facade clinical operations
as Node and requires a SMART `accessToken`; it refuses to substitute the login
`idToken`.

Delivery is injected through `FrontClinicalCarrier`. Use
`createFetchFrontClinicalCarrier(...)` online. An Expo offline queue or
Bluetooth adapter implements the same carrier and receives the already packed
`RenderedTransportRequest`; it must preserve the JWE bytes and `thid` and must
not decrypt or rebuild the message.

## Native confidential profile

The frontend SDK deliberately does not own platform secret storage. An Expo or
native host supplies two adapters:

1. A profile protector whose host wrapping key is non-exportable in iOS
   Keychain/Secure Enclave or Android Keystore. The user's PIN is processed by
   scrypt and protects the host-wrapped random DEK; salt and KDF parameters are
   persisted as public envelope metadata.
2. A `SecureDidcommTransportAdapter` created only after unlock and backed by
   the restored wallet keys.

For offline-first operation, persist the canonical outbox job before packing,
then persist the exact packed JWE before attempting a carrier. HTTP and
Bluetooth are delivery strategies for those same bytes. Store recipient,
`thid`, expiry, attempt count and receipt/replay status alongside the opaque
JWE. A carrier must never deserialize FHIR content or rotate the thread id.

Local PIN unlock is not remote authorization. Synchronization with GW still
requires a valid subject-and-scope-bound SMART token and consent/policy check.
