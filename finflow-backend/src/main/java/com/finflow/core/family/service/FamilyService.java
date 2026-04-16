package com.finflow.core.family.service;

import com.finflow.core.enums.RoleEnum;
import com.finflow.core.exception.FamilyException;
import com.finflow.core.family.domain.Family;
import com.finflow.core.family.domain.User;
import com.finflow.core.family.dto.AddMemberRequest;
import com.finflow.core.family.dto.FamilyCreateRequest;
import com.finflow.core.family.dto.FamilyResponse;
import com.finflow.core.family.dto.RevokeMemberRequest;
import com.finflow.core.family.repository.FamilyRepository;
import com.finflow.core.family.repository.UserRepository;
import jakarta.transaction.Transactional;
import jdk.jshell.spi.ExecutionControl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FamilyService {
    private final FamilyRepository familyRepository;
    private final UserRepository userRepository;

    @Transactional
    public FamilyResponse createFamily(FamilyCreateRequest familyCreateRequest) {
        User creator = userRepository.findByEmail(familyCreateRequest.getCreatorEmail())
                .orElseThrow(()-> new FamilyException("Không tìm thấy người tạo"));

        if (creator.getFamily() != null) throw new FamilyException("Người đàng quàng không có 2 gia đình");

        Family newFamily = Family.builder()
                .name(familyCreateRequest.getName())
                .billingDate(familyCreateRequest.getBillingDate())
                .build();

        familyRepository.save(newFamily);

        creator.setFamily(newFamily);
        creator.setRole(RoleEnum.HEAD);
        userRepository.save(creator);
        return FamilyResponse.builder()
                .id(newFamily.getId())
                .billingDate(newFamily.getBillingDate())
                .name(newFamily.getName())
                .message("Tạo gia đình " + newFamily.getName() + " thành công")
                .build();
    }

    @Transactional
    public void deleteFamily(UUID id, String requestEmail) {
        User deleter = userRepository.findByEmail(requestEmail)
                .orElseThrow(()-> new FamilyException("Không tìm thấy người dùng"));

        if (deleter.getFamily() == null) {
            throw new IllegalArgumentException("Bạn chưa tham gia gia đình nào!");
        }
        if (!deleter.getFamily().getId().equals(id)) {
            throw new IllegalArgumentException("Bạn không thể xóa gia đình của người khác!");
        }
        if (deleter.getRole() != RoleEnum.HEAD) {
            throw new IllegalArgumentException("Chỉ có Chủ hộ mới có quyền xóa gia đình!");
        }

        Family familyToDelete = deleter.getFamily();
        List<User> users = familyToDelete.getMembers();

        for (User user: users) {
            user.setRole(RoleEnum.USER);
            user.setFamily(null);
        }

        userRepository.saveAll(users);
        familyRepository.delete(familyToDelete);
    }

    @Transactional
    public void addMemberToFamily(AddMemberRequest addMemberRequest){
        List<String> emails = addMemberRequest.getUserEmail();
        UUID familyId = addMemberRequest.getFamilyId();
        String adderEmail = addMemberRequest.getAdderEmail();

        Family family = familyRepository.findById(familyId).orElseThrow(() -> new FamilyException("Không tìm thấy gia đình"));

        User head = userRepository.findByEmail(adderEmail).orElseThrow(()-> new FamilyException("Không tìm thấy chủ hộ"));
        if (head.getRole() != RoleEnum.HEAD && family.getMembers().contains(head)) {
            throw new FamilyException("Chỉ chủ hộ mới được thêm thành viên");
        }

        for (String email: emails) {
            if (userRepository.findByEmail(email).isPresent()) {
                User newMember = userRepository.findByEmail(email).get();
                if (newMember.getRole() != RoleEnum.USER){
                    throw new FamilyException("Người được thêm vào gia đình phải là thành viên");
                }
                if (newMember.getFamily() != null) {
                    throw new FamilyException("Người được mời không được ở gia đình khác");
                }
                family.getMembers().add(newMember);
                newMember.setRole(RoleEnum.USER);
            }
            else throw new FamilyException("Người dùng " + email + " không tồn tại\n");
        }

        family.getMembers().forEach(user -> user.setFamily(family));

        familyRepository.save(family);
        userRepository.saveAll(family.getMembers());
    }

    @Transactional
    public void evictMember(RevokeMemberRequest revokeMemberRequest){
        List<String> emails = revokeMemberRequest.getUserEmail();
        UUID familyId = revokeMemberRequest.getFamilyId();
        String adderEmail = revokeMemberRequest.getAdderEmail();

        Family family = familyRepository.findById(familyId).orElseThrow(() -> new FamilyException("Không tìm thấy gia đình"));

        User head = userRepository.findByEmail(adderEmail).orElseThrow(()-> new FamilyException("Không tìm thấy chủ hộ"));
        if (head.getRole() != RoleEnum.HEAD || !family.getMembers().contains(head)) {
            throw new FamilyException("Chỉ chủ hộ mới được xóa thành viên");
        }

        List<User> evictedMembers = new ArrayList<>();

        for (String email: emails) {
            if (userRepository.findByEmail(email).isPresent()) {
                User member = userRepository.findByEmail(email).get();
                if (member.getRole() != RoleEnum.USER || !family.getMembers().contains(member)){
                    throw new FamilyException("Người được xóa không phải là thành viên gia đình");
                }
                member.setFamily(null);
                family.getMembers().remove(member);
                evictedMembers.add(member);
            }
            else throw new FamilyException("Người dùng " + email + " không tồn tại\n");
        }

        familyRepository.save(family);
        userRepository.saveAll(evictedMembers);
    }
}
