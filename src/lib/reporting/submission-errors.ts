import "server-only";

/**
 * A CompanySubmission exists and the caller is authorized to act on it,
 * but its current status does not permit the requested operation (e.g.
 * submitting a submission that is already `submitted`/`under_review`/
 * `approved`). Mapped to one generic client message -- never reveals the
 * submission's actual current status, which would otherwise let a caller
 * probe workflow state they aren't authorized to see in detail.
 */
export class InvalidTransitionError extends Error {}
