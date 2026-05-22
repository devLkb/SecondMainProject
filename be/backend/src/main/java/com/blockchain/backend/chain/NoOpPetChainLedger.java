package com.blockchain.backend.chain;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * chain.enabled=false (기본) 일 때 사용되는 no-op 구현.
 * 모든 메서드가 빈 문자열/0을 반환해 오프체인 경로를 그대로 유지한다.
 */
@Component
@ConditionalOnProperty(name = "chain.enabled", havingValue = "false", matchIfMissing = true)
public class NoOpPetChainLedger implements PetChainLedger {

    @Override public boolean isEnabled() { return false; }

    @Override
    public String registerRecord(String a, String b, String c, String d, String e) { return ""; }

    @Override
    public String registerConsent(String a, String b, String c, String d, String e, String f) { return ""; }

    @Override
    public String revokeConsent(String a, String b, String c) { return ""; }

    @Override
    public String createSubmissionWithConsent(String a, String b, String c,
                                               String d, String e, String f, String g) { return ""; }

    @Override
    public String recordVerification(String a, String b, String c, String d,
                                      String e, String f, String g, String h) { return ""; }

    @Override
    public String processSuccessfulVerification(String a, String b, String c,
                                                 String d, String e, String f, String g) { return ""; }

    @Override
    public String issuePoints(String a, String b, String c, String d) { return ""; }

    @Override
    public String confirmPointPurchase(String a, String b, String c, String d,
                                        String e, String f, String g, String h) { return ""; }

    @Override
    public long getPointBalance(String insurerId) { return 0L; }
}
