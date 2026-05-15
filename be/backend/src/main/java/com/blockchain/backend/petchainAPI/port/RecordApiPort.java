package com.blockchain.backend.petchainAPI.port;

import com.blockchain.backend.petchainAPI.dto.record.RecordDtos;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface RecordApiPort {
    RecordDtos.CreateRecordResponse createRecord(ApiActor actor,
                                                 RecordDtos.CreateRecordRequest request,
                                                 MultipartFile recordFile,
                                                 List<MultipartFile> attachments);

    RecordDtos.RecordListResponse listRecords(ApiActor actor, RecordDtos.RecordSearchRequest request);

    RecordDtos.RecordDetailResponse getRecord(ApiActor actor, String recordId);
}
