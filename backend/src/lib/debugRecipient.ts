export interface ResolvedRecipient {
  to: string;
  redirectedFrom: string | null;
}

// Without a verified sending domain, Resend rejects a real lead's address outright —
// the send is accepted by the API, then failed with "Domain is not verified". Only the
// account's own signup email and the resend.dev test sinks are deliverable. So in debug
// mode every send is redirected to one safe address, which both makes the pipeline
// (send → open → follow-ups) actually exercisable and guarantees a dev machine can
// never email a real lead. Never redirects outside debug mode.
export function resolveSendRecipient(
  intendedTo: string,
  opts: { debug: boolean; redirectTo: string },
): ResolvedRecipient {
  if (opts.debug && opts.redirectTo) {
    return { to: opts.redirectTo, redirectedFrom: intendedTo };
  }
  return { to: intendedTo, redirectedFrom: null };
}
