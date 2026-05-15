package com.blockchain.backend.util;

import java.security.SecureRandom;
import java.time.Year;

public class MemberNumberGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();

    public static String generateUserNumber() {
        return "U-" + digits(8);
    }

    public static String generateHospitalNumber() {
        return "H-" + digits(8);
    }

    public static String generateInsuranceNumber() {
        return "P-" + digits(8);
    }

    public static String generatePetNumber() {
        return "A-" + digits(8);
    }

    public static String generateRecordId() {
        return "REC-" + Year.now().getValue() + "-" + digits(5);
    }

    public static String generateClaimId() {
        return "CLM-" + Year.now().getValue() + "-" + digits(5);
    }

    public static String generateNftTokenId() {
        return "NFT-CLAIM-" + hex(10);
    }

    private static String digits(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(RANDOM.nextInt(10));
        }
        return sb.toString();
    }

    private static String hex(int length) {
        StringBuilder sb = new StringBuilder(length);
        String chars = "0123456789abcdef";
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(RANDOM.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
