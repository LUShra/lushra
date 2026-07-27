"use client";

import { useActionState } from "react";

import { Badge, Button, FormMessage, Inline, Stack } from "@lushra/ui";

import { ARTIFACT_STATUS_BADGE_VARIANTS, ARTIFACT_STATUS_LABELS, type ArtifactStatus } from "./artifact-status";
import type { Artifact } from "./list-artifacts";
import {
  approveArtifactAction,
  rejectArtifactAction,
  reopenArtifactAction,
  submitForReviewAction,
  type ReviewActionState
} from "./review-actions";

const initialState: ReviewActionState = { status: "idle" };

export type ArtifactReviewActionsProps = {
  artifact: Artifact;
  projectId: string;
};

export function ArtifactReviewActions({ artifact, projectId }: ArtifactReviewActionsProps) {
  const status = artifact.status as ArtifactStatus;

  const [submitState, submitFormAction, isSubmitPending] = useActionState(
    submitForReviewAction,
    initialState
  );
  const [approveState, approveFormAction, isApprovePending] = useActionState(
    approveArtifactAction,
    initialState
  );
  const [rejectState, rejectFormAction, isRejectPending] = useActionState(
    rejectArtifactAction,
    initialState
  );
  const [reopenState, reopenFormAction, isReopenPending] = useActionState(
    reopenArtifactAction,
    initialState
  );

  return (
    <Stack gap={3}>
      <Badge variant={ARTIFACT_STATUS_BADGE_VARIANTS[status]}>
        {ARTIFACT_STATUS_LABELS[status]}
      </Badge>

      <Inline gap={3}>
        {status === "draft" ? (
          <form action={submitFormAction}>
            <input name="artifactId" type="hidden" value={artifact.id} />
            <input name="projectId" type="hidden" value={projectId} />
            <Button loading={isSubmitPending} size="small" type="submit">
              Submit for review
            </Button>
          </form>
        ) : null}

        {status === "in_review" ? (
          <>
            <form action={approveFormAction}>
              <input name="artifactId" type="hidden" value={artifact.id} />
              <input name="projectId" type="hidden" value={projectId} />
              <Button loading={isApprovePending} size="small" type="submit">
                Approve
              </Button>
            </form>

            <form action={rejectFormAction}>
              <input name="artifactId" type="hidden" value={artifact.id} />
              <input name="projectId" type="hidden" value={projectId} />
              <Button loading={isRejectPending} size="small" type="submit" variant="danger">
                Reject
              </Button>
            </form>
          </>
        ) : null}

        {status === "approved" || status === "rejected" ? (
          <form action={reopenFormAction}>
            <input name="artifactId" type="hidden" value={artifact.id} />
            <input name="projectId" type="hidden" value={projectId} />
            <Button loading={isReopenPending} size="small" type="submit" variant="secondary">
              Reopen
            </Button>
          </form>
        ) : null}
      </Inline>

      {submitState.status === "error" && submitState.message ? (
        <FormMessage tone="error">{submitState.message}</FormMessage>
      ) : null}
      {approveState.status === "error" && approveState.message ? (
        <FormMessage tone="error">{approveState.message}</FormMessage>
      ) : null}
      {rejectState.status === "error" && rejectState.message ? (
        <FormMessage tone="error">{rejectState.message}</FormMessage>
      ) : null}
      {reopenState.status === "error" && reopenState.message ? (
        <FormMessage tone="error">{reopenState.message}</FormMessage>
      ) : null}
    </Stack>
  );
}
