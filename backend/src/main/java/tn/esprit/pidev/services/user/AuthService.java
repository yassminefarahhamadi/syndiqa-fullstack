package tn.esprit.pidev.services.user;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.dto.*;
import tn.esprit.pidev.entities.communityevents.AccountStatus;
import tn.esprit.pidev.entities.user.*;
import tn.esprit.pidev.entities.organization.*;
import tn.esprit.pidev.exception.*;
import tn.esprit.pidev.repositories.user.*;
import tn.esprit.pidev.repositories.organization.*;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AccountRepository accountRepository;
    private final OrganizationRepository organizationRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final ResidentProfileRepository residentProfileRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final TokenService tokenService;
    private final EmailService emailService;
    private final AuditLogService auditLogService;
    private final RateLimiterService rateLimiterService;
    private final PasswordEncoder passwordEncoder;

    // ═══════════════════════════════════════════════
    //                  REGISTER
    // ═══════════════════════════════════════════════

    public void register(RegisterDto dto) {
        // Check duplicate email
        if (accountRepository.existsByEmail(dto.getEmail().toLowerCase())) {
            throw new ConflictException("Email already registered");
        }

        AccountRole role = dto.getRole() != null ? dto.getRole() : AccountRole.SYNDIC_ADMIN;

        // Only SYNDIC_ADMIN registrations create a new organization
        Organization org = null;
        if (AccountRole.SYNDIC_ADMIN.equals(role)) {
            org = Organization.builder()
                    .name(dto.getOrgName())
                    .address(dto.getOrgAddress())
                    .city(dto.getOrgCity())
                    .build();
            org = organizationRepository.save(org);
        }

        // Create account
        Account account = Account.builder()
                .organizationId(org != null ? org.getId() : null)
                .email(dto.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(dto.getPassword()))
                .role(role)
                .status(AccountStatus.ACTIVE)
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .phone(dto.getPhone())
                .build();
        account = accountRepository.save(account);

        // Link org to manager (SYNDIC_ADMIN only)
        if (org != null) {
            org.setManagerAccountId(account.getId());
            org.getMemberAccountIds().add(account.getId());
            organizationRepository.save(org);
        }

        // Generate email verification token (32-byte hex, 24h expiry)
        String rawToken = TokenService.generateRandomToken(32);
        String tokenHash = TokenService.sha256(rawToken);

        EmailVerification verification = EmailVerification.builder()
                .accountId(account.getId())
                .tokenHash(tokenHash)
                .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                .build();
        emailVerificationRepository.save(verification);

        // Send verification email
        emailService.sendVerificationEmail(account.getEmail(), rawToken, account.getFirstName());

        log.info("Registration initiated for {} with role {} (org: {})", account.getEmail(), account.getRole(), org != null ? org.getName() : "none");
    }

    // ═══════════════════════════════════════════════
    //              VERIFY EMAIL
    // ═══════════════════════════════════════════════

    public AuthResponse verifyEmail(String rawToken, String deviceInfo, String ip) {
        String tokenHash = TokenService.sha256(rawToken);

        EmailVerification verification = emailVerificationRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired verification token"));

        if (verification.isVerified()) {
            throw new BadRequestException("Email already verified");
        }

        if (verification.getExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Verification token expired");
        }

        // Activate account
        Account account = accountRepository.findById(verification.getAccountId())
                .orElseThrow(() -> new NotFoundException("Account not found"));

        account.setStatus(AccountStatus.ACTIVE);
        account.setLastLoginAt(Instant.now());
        accountRepository.save(account);

        // Mark verification as used
        verification.setVerified(true);
        emailVerificationRepository.save(verification);

        // Generate tokens
        String accessToken = tokenService.generateAccessToken(account);
        tokenService.createRefreshToken(account.getId(), deviceInfo, ip);

        auditLogService.log(account.getId(), "EMAIL_VERIFIED", ip, deviceInfo, null);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .account(toSummary(account))
                .build();
    }

    // ═══════════════════════════════════════════════
    //                   INVITE
    // ═══════════════════════════════════════════════

    public void invite(InviteDto dto, String inviterAccountId) {
        Account inviter = accountRepository.findById(inviterAccountId)
                .orElseThrow(() -> new NotFoundException("Inviter account not found"));

        // Validate org isolation
        if (!inviter.getOrganizationId().equals(dto.getOrganizationId())) {
            throw new ForbiddenException("Cannot invite to a different organization");
        }

        // Only SYNDIC_ADMIN and PLATFORM_ADMIN can invite
        if (inviter.getRole() != AccountRole.SYNDIC_ADMIN && inviter.getRole() != AccountRole.PLATFORM_ADMIN) {
            throw new ForbiddenException("Only SYNDIC_ADMIN can invite members");
        }

        // Check duplicate email
        if (accountRepository.existsByEmail(dto.getEmail().toLowerCase())) {
            throw new ConflictException("Email already registered");
        }

        // Create Account with status PENDING
        Account account = Account.builder()
                .organizationId(dto.getOrganizationId())
                .email(dto.getEmail().toLowerCase())
                .role(dto.getRole())
                .status(AccountStatus.PENDING)
                .build();

        // Generate invite token (32-byte hex, 72h expiry)
        String rawToken = TokenService.generateRandomToken(32);
        account.setPasswordResetToken(TokenService.sha256(rawToken)); // reuse field for invite token
        account.setResetExpiresAt(Instant.now().plus(72, ChronoUnit.HOURS));

        account = accountRepository.save(account);

        // Add to org members
        Organization org = organizationRepository.findById(dto.getOrganizationId())
                .orElseThrow(() -> new NotFoundException("Organization not found"));
        org.getMemberAccountIds().add(account.getId());
        organizationRepository.save(org);

        // Send invitation email
        String inviterName = inviter.getFirstName() + " " + inviter.getLastName();
        emailService.sendInvitationEmail(dto.getEmail(), rawToken, inviterName,
                org.getName(), dto.getRole().name());

        log.info("Invitation sent to {} for role {} in org {}", dto.getEmail(), dto.getRole(), org.getName());
    }

    // ═══════════════════════════════════════════════
    //              ACCEPT INVITE
    // ═══════════════════════════════════════════════

    public AuthResponse acceptInvite(String rawToken, AcceptInviteDto dto, String deviceInfo, String ip) {
        String tokenHash = TokenService.sha256(rawToken);

        // Find account with matching invite token
        Account account = accountRepository.findAll().stream()
                .filter(a -> tokenHash.equals(a.getPasswordResetToken()))
                .findFirst()
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired invitation token"));

        if (account.getStatus() != AccountStatus.PENDING) {
            throw new BadRequestException("Invitation already accepted");
        }

        if (account.getResetExpiresAt() == null || account.getResetExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Invitation token expired");
        }

        // Set up the account
        account.setFirstName(dto.getFirstName());
        account.setLastName(dto.getLastName());
        account.setPhone(dto.getPhone());
        account.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        account.setStatus(AccountStatus.ACTIVE);
        account.setPasswordResetToken(null);
        account.setResetExpiresAt(null);
        account.setLastLoginAt(Instant.now());
        accountRepository.save(account);

        // Auto-create profile based on role
        if (account.getRole() == AccountRole.RESIDENT) {
            ResidentProfile profile = ResidentProfile.builder()
                    .accountId(account.getId())
                    .organizationId(account.getOrganizationId())
                    .notifPrefs(List.of(NotifPref.IN_APP))
                    .build();
            residentProfileRepository.save(profile);
        } else if (account.getRole() == AccountRole.TECHNICAL_STAFF) {
            StaffProfile profile = StaffProfile.builder()
                    .accountId(account.getId())
                    .organizationId(account.getOrganizationId())
                    .hireDate(LocalDate.now())
                    .build();
            staffProfileRepository.save(profile);
        }

        // Generate tokens
        String accessToken = tokenService.generateAccessToken(account);
        tokenService.createRefreshToken(account.getId(), deviceInfo, ip);

        auditLogService.log(account.getId(), "INVITE_ACCEPTED", ip, deviceInfo, null);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .account(toSummary(account))
                .build();
    }

    // ═══════════════════════════════════════════════
    //                   LOGIN
    // ═══════════════════════════════════════════════

    public LoginResult login(LoginDto dto, String deviceInfo, String ip) {
        // Rate limit check bypassed for dev
        // if (!rateLimiterService.tryConsumeLogin(ip)) {
        //     throw new RateLimitException("Too many login attempts. Try again in 15 minutes.");
        // }

        Account account = accountRepository.findByEmail(dto.getEmail().toLowerCase())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(dto.getPassword(), account.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new ForbiddenException("Account is " + account.getStatus().name().toLowerCase());
        }

        // Update last login
        account.setLastLoginAt(Instant.now());
        accountRepository.save(account);

        // Generate tokens
        String accessToken = tokenService.generateAccessToken(account);
        String rawRefreshToken = tokenService.createRefreshToken(account.getId(), deviceInfo, ip);

        auditLogService.log(account.getId(), "LOGIN", ip, deviceInfo, null);

        AuthResponse response = AuthResponse.builder()
                .accessToken(accessToken)
                .account(toSummary(account))
                .build();

        return new LoginResult(response, rawRefreshToken);
    }

    // ═══════════════════════════════════════════════
    //                  REFRESH
    // ═══════════════════════════════════════════════

    public RefreshResult refresh(String rawRefreshToken, String deviceInfo, String ip) {
        Object[] result = tokenService.rotateRefreshToken(rawRefreshToken, deviceInfo, ip);
        String accountId = (String) result[0];
        String newRawRefreshToken = (String) result[1];

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new UnauthorizedException("Account not found"));

        if (account.getStatus() != AccountStatus.ACTIVE) {
            tokenService.revokeAllForAccount(accountId);
            throw new ForbiddenException("Account is " + account.getStatus().name().toLowerCase());
        }

        String accessToken = tokenService.generateAccessToken(account);

        return new RefreshResult(accessToken, newRawRefreshToken);
    }

    // ═══════════════════════════════════════════════
    //                  LOGOUT
    // ═══════════════════════════════════════════════

    public void logout(String rawRefreshToken, String accountId, String ip, String deviceInfo) {
        tokenService.revokeToken(rawRefreshToken);
        auditLogService.log(accountId, "LOGOUT", ip, deviceInfo, null);
    }

    public void logoutAll(String accountId, String ip, String deviceInfo) {
        tokenService.revokeAllForAccount(accountId);
        auditLogService.log(accountId, "LOGOUT_ALL", ip, deviceInfo, null);
    }

    // ═══════════════════════════════════════════════
    //              FORGOT PASSWORD
    // ═══════════════════════════════════════════════

    public void forgotPassword(String email, String ip, String deviceInfo) {
        // Rate limit
        if (!rateLimiterService.tryConsumeForgotPassword(email)) {
            // Still return 200 — no user enumeration
            return;
        }

        accountRepository.findByEmail(email.toLowerCase()).ifPresent(account -> {
            // Generate reset token (32-byte hex, 1h expiry)
            String rawToken = TokenService.generateRandomToken(32);
            account.setPasswordResetToken(TokenService.sha256(rawToken));
            account.setResetExpiresAt(Instant.now().plus(1, ChronoUnit.HOURS));
            accountRepository.save(account);

            emailService.sendPasswordResetEmail(account.getEmail(), rawToken, account.getFirstName());

            auditLogService.log(account.getId(), "PASSWORD_RESET_REQUESTED", ip, deviceInfo, null);
        });
    }

    // ═══════════════════════════════════════════════
    //              RESET PASSWORD
    // ═══════════════════════════════════════════════

    public void resetPassword(ResetPasswordDto dto, String ip, String deviceInfo) {
        String tokenHash = TokenService.sha256(dto.getToken());

        Account account = accountRepository.findAll().stream()
                .filter(a -> tokenHash.equals(a.getPasswordResetToken()))
                .findFirst()
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired reset token"));

        if (account.getResetExpiresAt() == null || account.getResetExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Reset token expired");
        }

        // Update password
        account.setPasswordHash(passwordEncoder.encode(dto.getNewPassword()));
        account.setPasswordResetToken(null);
        account.setResetExpiresAt(null);
        accountRepository.save(account);

        // Revoke ALL active sessions (force re-login everywhere)
        tokenService.revokeAllForAccount(account.getId());

        auditLogService.log(account.getId(), "PASSWORD_RESET", ip, deviceInfo, null);
    }

    // ═══════════════════════════════════════════════
    //                  HELPERS
    // ═══════════════════════════════════════════════

    private AccountSummaryDto toSummary(Account account) {
        return AccountSummaryDto.builder()
                .id(account.getId())
                .role(account.getRole())
                .organizationId(account.getOrganizationId())
                .firstName(account.getFirstName())
                .lastName(account.getLastName())
                .build();
    }

    // Result wrappers (to return both response + raw refresh token for cookie setting)
}



