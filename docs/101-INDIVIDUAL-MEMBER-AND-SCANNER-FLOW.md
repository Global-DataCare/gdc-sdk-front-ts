# 101: invited member first, reusable scanner second

The frontend contract is actor-scoped, not product- or component-scoped. The
controller invitation flow is completed first; the same subject-locator and
access-request component can then be reused by an individual member, a
professional or another authenticated actor facade.

The executable reference is
`tests/101-individual-member-invitation-smart-flow.test.mjs`. It imports the
canonical examples from Common Utils and proves this order:

1. `IndividualControllerSdk.addFreeMemberLicenses(...)` creates capacity.
2. `IndividualControllerSdk.issueMemberInvitationLicense(...)` reserves a seat
   for an already persisted RelatedPerson invitation.
3. `IndividualMemberSdk.acceptMemberInvitation(...)` accepts it with the
   authenticated member's verified identifier.
4. `IndividualMemberSdk.requestSmartToken(...)` asks for the selected subject
   and sections.
5. GW evaluates the current Consent rules and returns only explicit granted
   scopes. The invitation or relationship alone grants nothing.
6. `IndividualMemberSdk.requestClinicalSummary(...)` reads the permitted
   document with that subject-scoped SMART access token.

`ProfessionalSdk` uses the same last three authorization boundaries after its
own identity/licence proof. A React/Vue/native scanner therefore collects only
a public locator (`QR`, numeric code or `did:web`) and selected sections. It
must not encode “member” or “professional” in the component. The authenticated
BFF selects the actor facade.

If the actor is already covered by Consent, the BFF requests the narrowed SMART
token and reads the summary. If not, it records an access-request
`Communication`; the controller may later approve or edit the request by
persisting Consent. Recording the request never creates authorization.

## Batch/collection section claim

For a clinical section command with an attached `Bundle.type=batch` or
`collection`, the section travels in the canonical `Communication.topic`
claim, projected to native FHIR `Communication.topic`. Do not put
`Composition.section` on the outer Communication and do not derive the section
from `payload.contentCodeableConcept`.

FHIR claim keys use `<ResourceType>.<concrete-parameter>`, without camelCase
aliases or pseudo-nested dotted paths. Schema.org claims are distinct and keep
their canonical camelCase properties.

## Browser, BFF and in-memory state

Clinical import and section editing use `ClinicalDocumentBffFlow`:

```ts
const flow = new ClinicalDocumentBffFlow({
  workingCopy,
  transport: authenticatedBffTransport,
  onSnapshot: setBundleInMemory,
})

await flow.execute({ kind: 'import', bundle: importedIps })
await flow.execute({ kind: 'section-update', bundle: sectionCommand })
```

The flow paints the optimistic Bundle, submits that exact command once, waits
for the BFF's durable job, and replaces memory only with authoritative GW
summary readback. A timeout remains visibly pending; a definite rejection
rolls back. Browser components never call
`ingestCommunicationAndUpdateIndex(...)`.

To render, call `toClinicalSectionViews(bundleInMemory, options)` once and map
each returned section to its already projected card list. Applications may use
any component library; they do not inspect `meta.claims` or rebuild placement
and title rules in JSX.
