package com.blockchain.backend.petchainLOGIN.service;

import com.blockchain.backend.common.DomainValues.MemberType;
import com.blockchain.backend.petchainDB.entity.Guardian;
import com.blockchain.backend.petchainDB.entity.Hospital;
import com.blockchain.backend.petchainDB.entity.InsuranceCompany;
import com.blockchain.backend.petchainDB.entity.User;
import com.blockchain.backend.petchainDB.repository.GuardianRepository;
import com.blockchain.backend.petchainDB.repository.HospitalRepository;
import com.blockchain.backend.petchainDB.repository.InsuranceCompanyRepository;
import com.blockchain.backend.petchainDB.repository.UserRepository;
import com.blockchain.backend.petchainLOGIN.dto.request.UpdateMeRequest;
import com.blockchain.backend.petchainLOGIN.dto.response.MeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// 로그인한 회원 본인의 프로필 조회/수정. 역할에 따라 guardians/hospitals/insurance_companies 중 한 곳을 사용한다.
@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;
    private final GuardianRepository guardianRepository;
    private final HospitalRepository hospitalRepository;
    private final InsuranceCompanyRepository insuranceCompanyRepository;

    @Transactional(readOnly = true)
    public MeResponse getMe(Long userId) {
        User user = requireUser(userId);
        return switch (user.getMemberType()) {
            case MemberType.HOSPITAL -> hospitalProfile(user);
            case MemberType.INSURANCE -> insuranceProfile(user);
            default -> guardianProfile(user);
        };
    }

    @Transactional
    public MeResponse updateMe(Long userId, UpdateMeRequest req) {
        User user = requireUser(userId);
        if (MemberType.USER.equals(user.getMemberType())) {
            Guardian guardian = guardianRepository.findByUser_Id(userId)
                    .orElseThrow(() -> new IllegalArgumentException("보호자 정보를 찾을 수 없습니다."));
            if (hasText(req.getName()))   guardian.setName(req.getName());
            if (hasText(req.getPhone()))  guardian.setPhone(req.getPhone());
            if (hasText(req.getEmail()))  guardian.setEmail(req.getEmail());
            if (hasText(req.getRegion())) guardian.setAddress(req.getRegion());
            guardianRepository.save(guardian);
        } else if (MemberType.HOSPITAL.equals(user.getMemberType())) {
            Hospital hospital = hospitalRepository.findByUser_Id(userId)
                    .orElseThrow(() -> new IllegalArgumentException("병원 정보를 찾을 수 없습니다."));
            if (hasText(req.getPhone()))  hospital.setPhone(req.getPhone());
            if (hasText(req.getEmail()))  hospital.setAdminEmail(req.getEmail());
            if (hasText(req.getRegion())) hospital.setAddress(req.getRegion());
            hospitalRepository.save(hospital);
        }
        return getMe(userId);
    }

    private MeResponse guardianProfile(User user) {
        Guardian g = guardianRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("보호자 정보를 찾을 수 없습니다."));
        return MeResponse.builder()
                .userId(user.getId())
                .memberType(user.getMemberType())
                .memberNumber(g.getMemberNumber())
                .name(g.getName())
                .email(g.getEmail())
                .phone(g.getPhone())
                .region(g.getAddress())
                .build();
    }

    private MeResponse hospitalProfile(User user) {
        Hospital h = hospitalRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("병원 정보를 찾을 수 없습니다."));
        return MeResponse.builder()
                .userId(user.getId())
                .memberType(user.getMemberType())
                .memberNumber(h.getMemberNumber())
                .name(h.getName())
                .email(h.getAdminEmail())
                .phone(h.getPhone())
                .region(h.getAddress())
                .orgName(h.getName())
                .fabricOrgId(h.getFabricOrgId())
                .build();
    }

    private MeResponse insuranceProfile(User user) {
        InsuranceCompany c = insuranceCompanyRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("보험사 정보를 찾을 수 없습니다."));
        return MeResponse.builder()
                .userId(user.getId())
                .memberType(user.getMemberType())
                .memberNumber(c.getMemberNumber())
                .name(c.getName())
                .email(c.getAdminEmail())
                .orgName(c.getName())
                .fabricOrgId(c.getFabricOrgId())
                .build();
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다."));
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
