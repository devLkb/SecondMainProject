package com.blockchain.backend.petchainAPI.service;

import com.blockchain.backend.petchainAPI.dto.submission.SubmissionDtos;
import com.blockchain.backend.petchainAPI.port.SubmissionApiPort;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import org.springframework.stereotype.Service;

@Service
public class SubmissionService implements SubmissionApiPort {

    @Override
    public SubmissionDtos.CreateSubmissionResponse createSubmission(ApiActor actor, SubmissionDtos.CreateSubmissionRequest request) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public SubmissionDtos.SubmissionStatusResponse getSubmission(ApiActor actor, String submissionId) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public SubmissionDtos.SubmissionPackageResponse getSubmissionPackage(ApiActor actor, String submissionId) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public SubmissionDtos.ClaimStatusResponse updateClaimStatus(ApiActor actor, String submissionId, SubmissionDtos.ClaimStatusRequest request) {
        throw new UnsupportedOperationException("Not implemented yet");
    }
}
