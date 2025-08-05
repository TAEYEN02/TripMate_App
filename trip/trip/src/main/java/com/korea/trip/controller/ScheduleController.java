package com.korea.trip.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.korea.trip.dto.MultiDayScheduleResponse;
import com.korea.trip.dto.PlaceDTO;
import com.korea.trip.dto.ScheduleCreateRequest;
import com.korea.trip.dto.ScheduleDTO;
import com.korea.trip.dto.ScheduleRequest;
import com.korea.trip.dto.ScheduleResponse;
import com.korea.trip.models.Schedule;
import com.korea.trip.models.UserPrincipal;
import com.korea.trip.security.CurrentUser;
import com.korea.trip.service.ScheduleService;
import com.korea.trip.util.GenerateItinerary;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/schedule")

public class ScheduleController {

	private final ScheduleService scheduleService;
	// 자동일정 생성 컨트롤러
	private final GenerateItinerary generateItinerary;

	public ScheduleController(ScheduleService scheduleService, GenerateItinerary generateItinerary) {
		this.scheduleService = scheduleService;
		this.generateItinerary = generateItinerary;
	}
	
	//스케줄 만들고 저장하는 컴포넌트
	@PostMapping("")
	public ResponseEntity<ScheduleDTO> createSchedule(
	    @RequestBody ScheduleCreateRequest request,
	    @CurrentUser UserPrincipal currentUser) {
	    try {
	        System.out.println("Creating schedule for user: " + currentUser.getId());
	        System.out.println("Request data: " + request);
	        ScheduleDTO savedSchedule = scheduleService.createSchedule(request, currentUser.getId());
	        return ResponseEntity.status(HttpStatus.CREATED).body(savedSchedule);
	    } catch (Exception e) {
	        System.err.println("Error creating schedule: " + e.getMessage());
	        e.printStackTrace();
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
	    }
	}

	@PostMapping("/auto-generate")
	public ResponseEntity<?> autoGenerate(@RequestBody ScheduleCreateRequest request,
	                                      @CurrentUser UserPrincipal currentUser) {
	    try {
	        ScheduleResponse schedule = scheduleService.generateSchedule(request.getDeparture(), request.getArrival(),
	                request.getStartTime(), request.getEndTime(), request.getTransportType());

	        scheduleService.saveScheduleToUser(schedule, currentUser.getId());

	        return ResponseEntity.ok(schedule);
	    } catch (Exception e) {
	        return ResponseEntity.status(500).body("서버 오류 발생: " + e.getMessage());
	    }
	}


	// 다일정 생성 엔드포인트
	@PostMapping("/generate-multi")
	public MultiDayScheduleResponse generateMultiDay(@RequestBody ScheduleRequest request) {
		// ScheduleRequest는 departure, arrival, date, days 필드가 있는 DTO
		return generateItinerary.generateMultiDaySchedule(request.getDeparture(), request.getArrival(),
				request.getDate(), request.getDays());
	}

    // 새로운 여행지 추천 엔드포인트
    @GetMapping("/places/recommend")
    public ResponseEntity<List<PlaceDTO>> getRecommendedPlaces(
            @RequestParam("keyword") String keyword,
            @RequestParam(value = "category", required = false, name="category") String category) {
        List<PlaceDTO> recommendedPlaces;
        if (category != null) {
            recommendedPlaces = scheduleService.getRecommendedPlacesByCategory(keyword, category);
        } else {
            recommendedPlaces = scheduleService.getRecommendedPlaces(keyword);
        }
        return ResponseEntity.ok(recommendedPlaces);
    }

	@GetMapping("/shared")
	public ResponseEntity<List<ScheduleDTO>> getSharedSchedules() {
		List<Schedule> sharedSchedules = scheduleService.getSharedSchedules();
		List<ScheduleDTO> dtoList = sharedSchedules.stream().map(ScheduleDTO::fromEntity).toList();
		return ResponseEntity.ok(dtoList);
	}

	@GetMapping("/my-schedules")
	public ResponseEntity<List<ScheduleDTO>> getMySchedules() {
	    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
	    if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal user)) {
	        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	    }

	    List<Schedule> schedules = scheduleService.getSchedulesByUserId(user.getId());
	    List<ScheduleDTO> dtos = schedules.stream().map(ScheduleDTO::fromEntity).toList();
	    return ResponseEntity.ok(dtos);
	}


	@GetMapping("/{id}")
	public ResponseEntity<ScheduleDTO> getScheduleById(@PathVariable("id") Long id) {
		Schedule schedule = scheduleService.getScheduleById(id);
		return ResponseEntity.ok(ScheduleDTO.fromEntity(schedule));
	}

	@GetMapping("/user/{userId}")
	public ResponseEntity<List<Schedule>> getSchedulesByUserId(@PathVariable("userId") Long userId) {
		List<Schedule> schedules = scheduleService.getSchedulesByUserId(userId);
		return ResponseEntity.ok(schedules);
	}

	@PutMapping("/{scheduleId}/share")
	public ResponseEntity<?> updateSchedulePublicStatus(@PathVariable("scheduleId") Long scheduleId,
			@RequestBody Map<String, Boolean> payload) {
		try {
			scheduleService.updateSchedulePublicStatus(scheduleId, payload.get("isPublic"));
			return ResponseEntity.ok().build();
		} catch (RuntimeException e) {
			return ResponseEntity.notFound().build();
		}
	}

	@PutMapping("/{id}")
    public ResponseEntity<ScheduleDTO> updateSchedule(@PathVariable("id") Long id, @RequestBody ScheduleDTO scheduleDTO) {
        Schedule updatedSchedule = scheduleService.updateSchedule(id, scheduleDTO);
        return ResponseEntity.ok(ScheduleDTO.fromEntity(updatedSchedule));
    }

	@DeleteMapping("/{id}")
	public ResponseEntity<?> deleteSchedule(@PathVariable("id") Long id) {
		try {
			scheduleService.deleteSchedule(id);
			return ResponseEntity.ok().build();
		} catch (RuntimeException e) {
			return ResponseEntity.notFound().build();
		}
	}

	@PostMapping("/copy/{id}")
	public ResponseEntity<ScheduleDTO> copySchedule(@PathVariable("id") Long id, @CurrentUser UserPrincipal currentUser) {
		try {
			ScheduleDTO copiedSchedule = scheduleService.copySchedule(id, currentUser.getId());
			return ResponseEntity.status(HttpStatus.CREATED).body(copiedSchedule);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@GetMapping("/shared/my")
	public ResponseEntity<List<ScheduleDTO>> getMySharedSchedules() {
	    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
	    if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal user)) {
	        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	    }

	    List<ScheduleDTO> sharedSchedules = scheduleService.getSharedSchedulesByUser(user.getId());
	    return ResponseEntity.ok(sharedSchedules);
	}

	@DeleteMapping("/schedule/place/{placeId}")
	public ResponseEntity<?> deletePlaceFromSchedule(@PathVariable("placeId") Long placeId,
			@AuthenticationPrincipal UserPrincipal user) {
		try {
			scheduleService.deletePlace(placeId, user.getId());
			return ResponseEntity.ok("삭제 성공");
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("삭제 실패: " + e.getMessage());
		}
	}

	@PostMapping("/{id}/like")
	public ResponseEntity<ScheduleDTO> likeSchedule(@PathVariable("id") Long id) {
		Schedule updatedSchedule = scheduleService.likeSchedule(id);
		return ResponseEntity.ok(ScheduleDTO.fromEntity(updatedSchedule));
	}

	@PostMapping("/{id}/dislike")
	public ResponseEntity<ScheduleDTO> dislikeSchedule(@PathVariable("id") Long id) {
		Schedule updatedSchedule = scheduleService.dislikeSchedule(id);
		return ResponseEntity.ok(ScheduleDTO.fromEntity(updatedSchedule));
	}

	@GetMapping("/saved/my")
	public ResponseEntity<List<ScheduleDTO>> getMySavedSchedules(@CurrentUser UserPrincipal currentUser) {
		try {
			List<ScheduleDTO> savedSchedules = scheduleService.getSavedSchedulesByUser(currentUser.getId());
			return ResponseEntity.ok(savedSchedules);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@DeleteMapping("/saved/{id}")
	public ResponseEntity<?> deleteSavedSchedule(@PathVariable("id") Long id, @CurrentUser UserPrincipal currentUser) {
		try {
			scheduleService.deleteSavedSchedule(id, currentUser.getId());
			return ResponseEntity.ok().build();
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}
}
