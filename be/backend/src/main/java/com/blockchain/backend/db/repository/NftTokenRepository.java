package com.blockchain.backend.db.repository;

import com.blockchain.backend.db.entity.NftToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NftTokenRepository extends JpaRepository<NftToken, Long> {
    boolean existsByTokenId(String tokenId);
    Optional<NftToken> findByClaimPackage_Id(Long claimPackageId);
}
