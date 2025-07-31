package com.korea.trip.controller;

import com.korea.trip.dto.LoginRequest;
import com.korea.trip.dto.SignUpRequest;
import com.korea.trip.dto.UserDto;
import com.korea.trip.models.User;
import com.korea.trip.repositories.UserRepository;
import com.korea.trip.config.JwtTokenProvider;
import com.korea.trip.service.CustomUserDetailsService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.transaction.Transactional;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private JavaMailSender mailSender;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        
        Optional<User> userOptional = userRepository.findByUserId(loginRequest.getUserId());
        if (userOptional.isEmpty()) {
            logger.warn("Login attempt for non-existent user: {}", loginRequest.getUserId());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }

        User user = userOptional.get();
        logger.info("Attempting login for user: {}. Stored password hash: {}", user.getUserId(), user.getPassword());

        // 비밀번호 확인
        boolean passwordMatches = passwordEncoder.matches(loginRequest.getPassword(), user.getPassword());
        logger.info("Password match result for user {}: {}", user.getUserId(), passwordMatches);

        if (!passwordMatches) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }

        UserDetails userDetails = customUserDetailsService.loadUserByUsername(loginRequest.getUserId());

        // 인증 객체 생성
        Authentication authentication = new UsernamePasswordAuthenticationToken(
            userDetails, null, userDetails.getAuthorities());
        
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // JWT 토큰생성
        String jwt = tokenProvider.generateToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(authentication);
        
        // 사용자 정보와 토큰을 함께 반환
        return ResponseEntity.ok(Map.of(
            "token", jwt,
            "refreshToken", refreshToken,
            "user", UserDto.from(user)
        ));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignUpRequest signUpRequest) {
        if (userRepository.existsByUserId(signUpRequest.getUserId())) {
            return ResponseEntity.badRequest().body("Error: UserId is already taken!");
        }

        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest().body("Error: Username is already taken!");
        }

        // Creating user's account
        User user = new User(
            signUpRequest.getUserId(),
            signUpRequest.getUsername(),
            passwordEncoder.encode(signUpRequest.getPassword()),
            signUpRequest.getEmail()
        );

        userRepository.save(user);

        return ResponseEntity.ok("User registered successfully!");
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        
        if (refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity.badRequest().body("Refresh token is required");
        }

        if (!tokenProvider.validateRefreshToken(refreshToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid refresh token");
        }

        try {
            Long userId = tokenProvider.getUserIdFromJWT(refreshToken);
            Optional<User> userOptional = userRepository.findById(userId);
            
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }

            User user = userOptional.get();
            UserDetails userDetails = customUserDetailsService.loadUserByUsername(user.getUserId());

            // 새로운 인증 객체 생성
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
            
            // 새로운 토큰들 생성
            String newAccessToken = tokenProvider.generateToken(authentication);
            String newRefreshToken = tokenProvider.generateRefreshToken(authentication);

            return ResponseEntity.ok(Map.of(
                "accessToken", newAccessToken,
                "refreshToken", newRefreshToken
            ));
        } catch (Exception e) {
            logger.error("Error refreshing token: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token refresh failed");
        }
    }

    @PostMapping("/check-userid")
    public ResponseEntity<?> checkUserId(@RequestBody Map<String, String> body) {
        String userId = body.get("userId");
        boolean exists = userRepository.existsByUserId(userId);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @PostMapping("/check-username")
    public ResponseEntity<?> checkUsername(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        boolean exists = userRepository.existsByUsername(username);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @PostMapping("/find-id")
    public ResponseEntity<?> findId(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String email = body.get("email");
        Optional<User> userOptional = userRepository.findByUsernameIgnoreCaseAndEmailIgnoreCase(username, email);

        if (userOptional.isPresent()) {
            return ResponseEntity.ok(Map.of("userId", userOptional.get().getUserId()));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
    }

    @Transactional
    @PostMapping("/find-password")
    public ResponseEntity<?> findPassword(@RequestBody Map<String, String> body) {
        String userId = body.get("userId");
        String email = body.get("email");
        Optional<User> userOptional = userRepository.findByUserId(userId);

        if (userOptional.isEmpty() || !userOptional.get().getEmail().equals(email)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found with given userId and email");
        }

        User user = userOptional.get();
        String tempPassword = UUID.randomUUID().toString().substring(0, 8);
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setTemporaryPassword(true);
        userRepository.save(user);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("[TripMate] 임시 비밀번호 안내");
            message.setText("안녕하세요, TripMate 임시 비밀번호는 " + tempPassword + " 입니다. 로그인 후 반드시 비밀번호를 변경해주세요.");
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to send email.");
        }

        return ResponseEntity.ok("Temporary password has been sent to your email.");
    }
}
