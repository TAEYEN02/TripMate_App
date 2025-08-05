package com.korea.trip.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.korea.trip.dto.CommentDto;
import com.korea.trip.models.UserPrincipal;
import com.korea.trip.service.CommentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/schedule/{scheduleId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    public ResponseEntity<List<CommentDto>> getComments(@PathVariable("scheduleId") Long scheduleId) {
        return ResponseEntity.ok(commentService.getComments(scheduleId));
    }

    @PostMapping
    public ResponseEntity<CommentDto> createComment(
            @PathVariable("scheduleId")Long scheduleId,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        String content = request.get("content");
        String parentIdStr = request.get("parentId");
        Long parentId = parentIdStr != null ? Long.parseLong(parentIdStr) : null;

        CommentDto newComment = commentService.createComment(scheduleId, content, userPrincipal.getId(), parentId);
        return ResponseEntity.ok(newComment);
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable("commentId") Long commentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        commentService.deleteComment(commentId, userPrincipal.getId());
        return ResponseEntity.ok().build();
    }
}
