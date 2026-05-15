package com.blockchain.backend.petchain.petchainAPI.service;

import com.blockchain.backend.petchain.petchainAPI.dto.record.RecordDtos;
import com.blockchain.backend.petchain.petchainAPI.port.RecordApiPort;
import com.blockchain.backend.petchain.petchainAPI.security.ApiActor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class RecordService implements RecordApiPort {

    @Override
    public RecordDtos.CreateRecordResponse createRecord(ApiActor actor, RecordDtos.CreateRecordRequest request, MultipartFile recordFile, List<MultipartFile> attachments) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public RecordDtos.RecordListResponse listRecords(ApiActor actor, RecordDtos.RecordSearchRequest request) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public RecordDtos.RecordDetailResponse getRecord(ApiActor actor, String recordId) {
        throw new UnsupportedOperationException("Not implemented yet");
    }
}
