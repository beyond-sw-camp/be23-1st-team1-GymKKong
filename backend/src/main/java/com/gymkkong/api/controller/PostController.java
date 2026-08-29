package com.gymkkong.api.controller;

import com.gymkkong.api.config.AuthUser;
import com.gymkkong.api.dto.CommunityDtos.*;
import com.gymkkong.api.service.CommunityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "게시글", description = "게시글 상세 / 수정 / 댓글")
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final CommunityService communityService;

    @Operation(summary = "게시글 상세")
    @GetMapping("/{postId}")
    public ResponseEntity<PostDetail> detail(@PathVariable Long postId,
                                             @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(communityService.detail(postId, viewerId(user)));
    }

    @Operation(summary = "게시글 수정", description = "작성자 본인 또는 관리자만 가능.")
    @PatchMapping("/{postId}")
    public ResponseEntity<PostDetail> update(@AuthenticationPrincipal AuthUser user,
                                             @PathVariable Long postId,
                                             @Valid @RequestBody PostUpdateRequest req) {
        return ResponseEntity.ok(communityService.update(user, postId, req));
    }

    @Operation(summary = "게시글 삭제")
    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthUser user,
                                       @PathVariable Long postId) {
        communityService.delete(user, postId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "댓글 목록")
    @GetMapping("/{postId}/comments")
    public ResponseEntity<List<CommentResponse>> comments(@PathVariable Long postId,
                                                          @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(communityService.comments(postId, viewerId(user)));
    }

    @Operation(summary = "댓글 작성", description = "회원/트레이너/관리자 모두 작성할 수 있다.")
    @PostMapping("/{postId}/comments")
    public ResponseEntity<CommentResponse> addComment(@AuthenticationPrincipal AuthUser user,
                                                      @PathVariable Long postId,
                                                      @Valid @RequestBody CommentCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(communityService.addComment(user, postId, req));
    }

    @Operation(summary = "댓글 삭제")
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@AuthenticationPrincipal AuthUser user,
                                              @PathVariable Long commentId) {
        communityService.deleteComment(user, commentId);
        return ResponseEntity.noContent().build();
    }

    private Long viewerId(AuthUser user) {
        return user != null ? user.id() : null;
    }
}
