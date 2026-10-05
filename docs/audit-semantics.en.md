# Audit log semantics for administrators

Connection types: 0=remote control, 1=file transfer, 2=port forwarding, 3=camera, 4=terminal.

File direction is from the **controlled endpoint** perspective: 0=controlled endpoint sends/controller downloads; 1=controlled endpoint receives/controller uploads. Unknown types/directions retain their raw numbers. Never remap historical 2/3 into known file directions.

`close_time=0` / historical `status=0` means no close report was received, not that the connection is online. File audit rows report operations, not completed or cancelled transfers; they prove neither success/integrity nor live connection status.

Audit reporting can be anonymous; nonce is not stored/deduplicated and there is no exactly-once guarantee. API failures return redacted 503, but visible rows do not prove a real client's entire retry/close path. Correct interpretations of old data without rewriting rows to guess directions.

Implementation/local fixtures: [connection columns](../src/views/audit/ConnList.vue), [file columns](../src/views/audit/FileList.vue), [semantics tests](../tests/audit-semantics.test.ts). These do not substitute for official 1.4.9/1.5.0 distinct-client E2E.
