package com.blockchain.backend.petchainAPI.port;

import com.blockchain.backend.petchainAPI.dto.submission.SubmissionDtos;
import com.blockchain.backend.petchainAPI.security.ApiActor;

public interface SubmissionApiPort {
    SubmissionDtos.CreateSubmissionResponse createSubmission(ApiActor actor, SubmissionDtos.CreateSubmissionRequest request);

    SubmissionDtos.SubmissionStatusResponse getSubmission(ApiActor actor, String submissionId);

    SubmissionDtos.SubmissionPackageResponse getSubmissionPackage(ApiActor actor, String submissionId);

    SubmissionDtos.ClaimStatusResponse updateClaimStatus(ApiActor actor,
                                                         String submissionId,
                                                         SubmissionDtos.ClaimStatusRequest request);
}
