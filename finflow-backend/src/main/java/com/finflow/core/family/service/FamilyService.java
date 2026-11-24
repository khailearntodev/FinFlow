package com.finflow.core.family.service;

import com.finflow.core.enums.RoleEnum;
import com.finflow.core.exception.FamilyException;
import com.finflow.core.family.domain.Family;
import com.finflow.core.family.domain.User;
import com.finflow.core.family.dto.AddMemberRequest;
import com.finflow.core.family.dto.FamilyCreateRequest;
import com.finflow.core.family.dto.FamilyResponse;
import com.finflow.core.family.dto.RevokeMemberRequest;
import com.finflow.core.family.dto.FamilyUpdateRequest;
import com.finflow.core.audit.repository.AuditLogRepository;
import com.finflow.core.expense.repository.ExpenseRepository;
import com.finflow.core.settlement.repository.SettlementRepository;
import com.finflow.core.family.repository.FamilyRepository;
import com.finflow.core.family.repository.UserRepository;
import jakarta.transaction.Transactional;
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
    private final ExpenseRepository expenseRepository;
    private final SettlementRepository settlementRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional
    public FamilyResponse createFamily(FamilyCreateRequest familyCreateRequest) {
        User creator = userRepository.findByEmail(familyCreateRequest.getCreatorEmail())
                .orElseThrow(()-> new FamilyException("Hong tìm thấy người tạo đâu hết á!"));

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
                .orElseThrow(()-> new FamilyException("Hong tìm thấy tài khoản của bạn đâu ròi!"));

        if (deleter.getFamily() == null) {
            throw new IllegalArgumentException("Bạn đã vô gia đình nào đâu mà xóa nè!");
        }
        if (!deleter.getFamily().getId().equals(id)) {
            throw new IllegalArgumentException("Bịp nha, gia đình người ta mà đòi xóa!");
        }
        if (deleter.getRole() != RoleEnum.HEAD) {
            throw new IllegalArgumentException("Chỉ có Chủ hộ mới được giải tán gia đình nha!");
        }

        Family familyToDelete = deleter.getFamily();
        UUID familyId = familyToDelete.getId();

        auditLogRepository.deleteByFamilyId(familyId);

        settlementRepository.deleteByFamilyId(familyId);

        expenseRepository.deleteByFamilyId(familyId);

        List<User> users = new java.util.ArrayList<>(familyToDelete.getMembers());
        for (User user: users) {
            user.setRole(RoleEnum.USER);
            user.setFamily(null);
        }
        userRepository.saveAll(users);
        familyToDelete.getMembers().clear();
        familyRepository.save(familyToDelete);

        familyRepository.delete(familyToDelete);
    }

    @Transactional
    public void addMemberToFamily(AddMemberRequest addMemberRequest){
        List<String> emails = addMemberRequest.getUserEmail().stream().distinct().toList();
        UUID familyId = addMemberRequest.getFamilyId();
        String adderEmail = addMemberRequest.getAdderEmail();

        Family family = familyRepository.findById(familyId).orElseThrow(() -> new FamilyException("Hong thấy gia đình này đâu ròi!"));

        User head = userRepository.findByEmail(adderEmail).orElseThrow(()-> new FamilyException("Hong tìm thấy Chủ hộ đâu hết á!"));
        if (head.getRole() != RoleEnum.HEAD || !family.getMembers().contains(head)) {
            throw new FamilyException("Chỉ Chủ hộ mới được mời thêm người vô nhà nha!");
        }

        for (String email: emails) {
            User newMember = userRepository.findByEmail(email).orElseThrow(() -> new FamilyException("Email " + email + " chưa có tài khoản á, kêu bạn tạo trước đi nha!"));
            if (newMember.getRole() != RoleEnum.USER){
                throw new FamilyException("Người này đang làm Chủ hộ nhà khác ròi, hong mời được nha!");
            }
            if (newMember.getFamily() != null) {
                throw new FamilyException("Người này có gia đình ròi, bịp nha, kêu rời nhà cũ trước đi!");
            }
            newMember.setFamily(family);
            newMember.setRole(RoleEnum.USER);
            family.getMembers().add(newMember);
        }

        familyRepository.save(family);
        userRepository.saveAll(family.getMembers());
    }

    @Transactional
    public void evictMember(RevokeMemberRequest revokeMemberRequest){
        List<String> emails = revokeMemberRequest.getUserEmail();
        UUID familyId = revokeMemberRequest.getFamilyId();
        String adderEmail = revokeMemberRequest.getAdderEmail();

        Family family = familyRepository.findById(familyId).orElseThrow(() -> new FamilyException("Hong thấy gia đình này đâu ròi!"));

        User head = userRepository.findByEmail(adderEmail).orElseThrow(()-> new FamilyException("Hong tìm thấy Chủ hộ đâu hết á!"));
        if (head.getRole() != RoleEnum.HEAD || !family.getMembers().contains(head)) {
            throw new FamilyException("Chỉ Chủ hộ mới có quyền mời người ra khỏi nhà nha!");
        }

        List<User> evictedMembers = new ArrayList<>();

        for (String email: emails) {
            if (userRepository.findByEmail(email).isPresent()) {
                User member = userRepository.findByEmail(email).get();
                if (member.getRole() != RoleEnum.USER || !family.getMembers().contains(member)){
                    throw new FamilyException("Bịp nha, người này đâu phải thành viên nhà mình!");
                }

                if (expenseRepository.hasPendingExpenses(familyId, member.getId().toString(), member.getId())) {
                    throw new FamilyException("Khoan nha, " + member.getFullName() + " còn khoản chi chưa chốt sổ á, chốt cho ok ròi hãy xóa!");
                }

                member.setFamily(null);
                family.getMembers().remove(member);
                evictedMembers.add(member);
            }
            else throw new FamilyException("Email " + email + " hong tồn tại đâu nha!");
        }

        familyRepository.save(family);
        userRepository.saveAll(evictedMembers);
    }

    @Transactional
    public FamilyResponse updateFamily(FamilyUpdateRequest updateRequest) {
        Family family = familyRepository.findById(UUID.fromString(updateRequest.getFamilyId()))
                .orElseThrow(() -> new FamilyException("Hong thấy gia đình này đâu ròi!"));

        User head = userRepository.findByEmail(updateRequest.getRequestEmail())
                .orElseThrow(() -> new FamilyException("Hong tìm thấy người thực hiện đâu hết á!"));

        if (head.getRole() != RoleEnum.HEAD || !family.getMembers().contains(head)) {
            throw new FamilyException("Chỉ Chủ hộ mới được đổi thiết lập gia đình nha!");
        }

        family.setName(updateRequest.getName());
        family.setBillingDate(updateRequest.getBillingDate());
        if (updateRequest.getMonthlyBudget() != null && updateRequest.getMonthlyBudget().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            family.setMonthlyBudget(null);
        } else {
            family.setMonthlyBudget(updateRequest.getMonthlyBudget());
        }
        familyRepository.save(family);

        return FamilyResponse.builder()
                .id(family.getId())
                .name(family.getName())
                .billingDate(family.getBillingDate())
                .message("Cập nhật thiết lập gia đình thành công")
                .build();
    }
}
