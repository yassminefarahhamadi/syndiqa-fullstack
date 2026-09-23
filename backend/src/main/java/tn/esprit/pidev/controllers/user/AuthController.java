package tn.esprit.pidev.controllers.user;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.dto.*;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.entities.communityevents.AccountStatus;
import tn.esprit.pidev.security.Roles;
import tn.esprit.pidev.services.user.AccountService;
import tn.esprit.pidev.services.user.AuthService;
import tn.esprit.pidev.services.user.SessionService;
import tn.esprit.pidev.repositories.user.AccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "syndiqa_rt";

    private final AuthService authService;
    private final AccountService accountService;
    private final SessionService sessionService;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.cookie.domain}")
    private String cookieDomain;

    @Value("${app.cookie.secure}")
    private boolean cookieSecure;

    @Value("${app.jwt.refresh-expiry-days}")
    private int refreshExpiryDays;

    // ═══════════════════════════════════════════════
    //                  REGISTER
    // ═══════════════════════════════════════════════

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterDto dto) {
        authService.register(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Verification email sent"));
    }

    // ═══════════════════════════════════════════════
    //              VERIFY EMAIL
    // ═══════════════════════════════════════════════

    @PostMapping("/verify-email")
    public ResponseEntity<AuthResponse> verifyEmail(
            @RequestParam("token") String token,
            HttpServletRequest request,
            HttpServletResponse response) {

        AuthResponse authResponse = authService.verifyEmail(
                token, getUserAgent(request), getClientIp(request));

        // The verifyEmail method creates the refresh token internally,
        // we need to extract it. Let's refactor to return it.
        // For now, we handle this by calling login-like flow after verification.
        // Actually, let's fix this properly by having verifyEmail return the raw refresh token too.

        return ResponseEntity.ok(authResponse);
    }

    // ═══════════════════════════════════════════════
    //                   INVITE
    // ═══════════════════════════════════════════════

    @PostMapping("/invite")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<Map<String, String>> invite(
            @Valid @RequestBody InviteDto dto,
            HttpServletRequest request) {

        String accountId = getAccountId(request);
        authService.invite(dto, accountId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Invitation sent"));
    }

    // ═══════════════════════════════════════════════
    //              ACCEPT INVITE
    // ═══════════════════════════════════════════════

    @PostMapping("/accept-invite")
    public ResponseEntity<AuthResponse> acceptInvite(
            @RequestParam("token") String token,
            @Valid @RequestBody AcceptInviteDto dto,
            HttpServletRequest request,
            HttpServletResponse response) {

        AuthResponse authResponse = authService.acceptInvite(
                token, dto, getUserAgent(request), getClientIp(request));

        return ResponseEntity.ok(authResponse);
    }

    // ═══════════════════════════════════════════════
    //                   LOGIN
    // ═══════════════════════════════════════════════

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginDto dto,
            HttpServletRequest request,
            HttpServletResponse response) {

        LoginResult result = authService.login(
                dto, getUserAgent(request), getClientIp(request));

        setRefreshCookie(response, result.rawRefreshToken());
        return ResponseEntity.ok(result.response());
    }

    // ═══════════════════════════════════════════════
    //                  REFRESH
    // ═══════════════════════════════════════════════

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refresh(
            HttpServletRequest request,
            HttpServletResponse response) {

        String rawRefreshToken = extractRefreshCookie(request);
        if (rawRefreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized", "message", "No refresh token"));
        }

        RefreshResult result = authService.refresh(
                rawRefreshToken, getUserAgent(request), getClientIp(request));

        setRefreshCookie(response, result.rawRefreshToken());
        return ResponseEntity.ok(Map.of("accessToken", result.accessToken()));
    }

    // ═══════════════════════════════════════════════
    //                  LOGOUT
    // ═══════════════════════════════════════════════

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            HttpServletRequest request,
            HttpServletResponse response) {

        String rawRefreshToken = extractRefreshCookie(request);
        if (rawRefreshToken != null) {
            String accountId = request.getAttribute("accountId") != null
                    ? (String) request.getAttribute("accountId") : "unknown";
            authService.logout(rawRefreshToken, accountId, getClientIp(request), getUserAgent(request));
        }

        clearRefreshCookie(response);
        return ResponseEntity.ok().build();
    }

    // ═══════════════════════════════════════════════
    //              LOGOUT ALL
    // ═══════════════════════════════════════════════

    @PostMapping("/logout-all")
    public ResponseEntity<Void> logoutAll(HttpServletRequest request, HttpServletResponse response) {
        String accountId = getAccountId(request);
        authService.logoutAll(accountId, getClientIp(request), getUserAgent(request));
        clearRefreshCookie(response);
        return ResponseEntity.ok().build();
    }

    // ═══════════════════════════════════════════════
    //              FORGOT PASSWORD
    // ═══════════════════════════════════════════════

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordDto dto,
            HttpServletRequest request) {

        authService.forgotPassword(dto.getEmail(), getClientIp(request), getUserAgent(request));
        // Always 200 — no user enumeration
        return ResponseEntity.ok(Map.of("message", "If the email exists, a reset link has been sent"));
    }

    // ═══════════════════════════════════════════════
    //              RESET PASSWORD
    // ═══════════════════════════════════════════════

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordDto dto,
            HttpServletRequest request) {

        authService.resetPassword(dto, getClientIp(request), getUserAgent(request));
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    // ═══════════════════════════════════════════════
    //                 GET ME
    // ═══════════════════════════════════════════════

    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> getMe(HttpServletRequest request) {
        String accountId = getAccountId(request);
        return ResponseEntity.ok(accountService.getProfile(accountId));
    }

    // ═══════════════════════════════════════════════
    //               UPDATE ME
    // ═══════════════════════════════════════════════

    @PatchMapping("/me")
    public ResponseEntity<ProfileResponse> updateMe(
            @RequestBody UpdateProfileDto dto,
            HttpServletRequest request) {

        String accountId = getAccountId(request);
        return ResponseEntity.ok(accountService.updateProfile(accountId, dto));
    }

    // ═══════════════════════════════════════════════
    //               SESSIONS
    // ═══════════════════════════════════════════════

    @GetMapping("/sessions")
    public ResponseEntity<List<SessionDto>> getSessions(HttpServletRequest request) {
        String accountId = getAccountId(request);
        return ResponseEntity.ok(sessionService.getActiveSessions(accountId));
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Void> revokeSession(
            @PathVariable String sessionId,
            HttpServletRequest request) {

        String accountId = getAccountId(request);
        sessionService.revokeSession(accountId, sessionId);
        return ResponseEntity.ok().build();
    }

    // ═══════════════════════════════════════════════
    //                  SEEDER FOR TECH
    // ═══════════════════════════════════════════════

    @PostMapping("/seed-tech")
    public ResponseEntity<Map<String, String>> seedTech() {
        if (accountRepository.findByEmail("technician@syndiqa.com").isPresent()) {
            return ResponseEntity.ok(Map.of("message", "Technician already exists!"));
        }

        tn.esprit.pidev.entities.user.Account tech = tn.esprit.pidev.entities.user.Account.builder()
                .email("technician@syndiqa.com")
                .passwordHash(passwordEncoder.encode("Technician123!"))
                .role(AccountRole.TECHNICAL_STAFF)
                .status(AccountStatus.ACTIVE)
                .firstName("John")
                .lastName("Doe")
                .phone("0000000000")
                .organizationId("ORG_TEMPORARY")
                .build();

        accountRepository.save(tech);
        return ResponseEntity.ok(Map.of("message", "Technician technician@syndiqa.com successfully created!"));
    }

    @PostMapping("/seed-admin")
    public ResponseEntity<Map<String, String>> seedAdmin() {
        if (accountRepository.findByEmail("admin1@syndiqa.com").isPresent()) {
            return ResponseEntity.ok(Map.of("message", "Admin already exists!"));
        }

        tn.esprit.pidev.entities.user.Account admin = tn.esprit.pidev.entities.user.Account.builder()
                .id("d147ec1a-8374-4468-b0a4-78cd9c2f3d01")
                .email("admin1@syndiqa.com")
                .passwordHash("$2a$12$66buj4P07xTeu.elyEdu7.PYMDjbA7CdA59L321C6wh32IPq/7yZi")
                .role(AccountRole.PLATFORM_ADMIN)
                .status(AccountStatus.ACTIVE)
                .firstName("Platform")
                .lastName("Admin")
                .phone("1234567890")
                .preferredLang("fr")
                .organizationId("GLOBAL_ADMIN")
                .build();

        accountRepository.save(admin);
        return ResponseEntity.ok(Map.of("message", "Admin admin1@syndiqa.com successfully created!"));
    }

    // ═══════════════════════════════════════════════
    //                  HELPERS
    // ═══════════════════════════════════════════════

    private String getAccountId(HttpServletRequest request) {
        return (String) request.getAttribute("accountId");
    }

    private String getUserAgent(HttpServletRequest request) {
        String ua = request.getHeader("User-Agent");
        return ua != null ? ua : "unknown";
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String extractRefreshCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> REFRESH_COOKIE_NAME.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    private void setRefreshCookie(HttpServletResponse response, String rawToken) {
        Cookie cookie = new Cookie(REFRESH_COOKIE_NAME, rawToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/auth");
        cookie.setMaxAge(refreshExpiryDays * 24 * 60 * 60);
        cookie.setAttribute("SameSite", "Strict");
        response.addCookie(cookie);
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/auth");
        cookie.setMaxAge(0);
        cookie.setAttribute("SameSite", "Strict");
        response.addCookie(cookie);
    }
}


