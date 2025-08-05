package com.korea.trip.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.korea.trip.dto.PlaceDTO;
import com.korea.trip.dto.place.PlaceResponse;
import com.korea.trip.dto.place.PlaceSearchRequest;
import com.korea.trip.service.PlaceService;
import com.korea.trip.util.KakaoPlaceUtil;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/place")
@RequiredArgsConstructor
public class PlaceController {

	private final PlaceService placeService;
	private final KakaoPlaceUtil kakaoPlaceUtil;

	// POST 방식: JSON body로 키워드+필터 검색 (DB 기반)
	@PostMapping("/search")
	public ResponseEntity<List<PlaceResponse>> searchPlaces(@RequestBody PlaceSearchRequest request) {
		List<PlaceResponse> results = placeService.searchPlacesFromDb(request);
		return ResponseEntity.ok(results);
	}

	// GET 방식: 쿼리 파라미터로 키워드+카테고리 검색 (Kakao API 기반)
	@GetMapping("/search")
	public ResponseEntity<List<PlaceDTO>> searchPlacesFromKakao(@RequestParam(name = "keyword") String keyword,
			@RequestParam(name = "category", required = false) String category) {
		List<PlaceDTO> results = placeService.searchPlaces(keyword, category);
		return ResponseEntity.ok(results);
	}

	@GetMapping("/{placeId}")
	public ResponseEntity<PlaceResponse> getPlaceDetail(@PathVariable("placeId") Long placeId) {
		PlaceResponse place = placeService.getPlaceById(placeId);
		return ResponseEntity.ok(place);
	}
	
	@GetMapping("/recommend")
    public ResponseEntity<List<PlaceDTO>> recommendPlaces(@RequestParam(name="keyword") String keyword) {
        List<PlaceDTO> places = kakaoPlaceUtil.searchRecommendedPlaces(keyword);
        return ResponseEntity.ok(places);
    }
	

}