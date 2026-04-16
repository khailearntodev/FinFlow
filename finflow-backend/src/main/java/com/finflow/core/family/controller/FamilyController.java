package com.finflow.core.family.controller;

import com.finflow.core.family.dto.AddMemberRequest;
import com.finflow.core.family.dto.FamilyCreateRequest;
import com.finflow.core.family.dto.FamilyResponse;
import com.finflow.core.family.dto.RevokeMemberRequest;
import com.finflow.core.family.service.FamilyService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/family")
@AllArgsConstructor
public class FamilyController {
    private final FamilyService familyService;

    @PostMapping("/")
    public ResponseEntity<FamilyResponse> createFamily(@Valid @RequestBody FamilyCreateRequest familyCreateRequest) {
        return ResponseEntity.ok(familyService.createFamily(familyCreateRequest));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteFamily(
            @PathVariable("id") UUID familyId, @RequestParam("email") String email) {
        familyService.deleteFamily(familyId, email);
        return ResponseEntity.ok("Xóa gia đình thành công");
    }

    @PostMapping("/add")
    public ResponseEntity<String> addMemberToFamily(@RequestBody @Valid AddMemberRequest addMemberRequest) {
        familyService.addMemberToFamily(addMemberRequest);
        String emailToString = String.join(", ", addMemberRequest.getUserEmail());
        return ResponseEntity.ok("Đã thêm thành công thành viên " + emailToString + " vào gia đình!");
    }

    @PostMapping("/revoke")
    public ResponseEntity<String> revokeMember(@RequestBody @Valid RevokeMemberRequest revokeMemberRequest) {
        familyService.evictMember(revokeMemberRequest);
        String emailToString = String.join(", ", revokeMemberRequest.getUserEmail());
        return ResponseEntity.ok("Đã đuổi thành viên " + emailToString + " ra khỏi nhà!");
    }
}