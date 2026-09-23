package tn.esprit.pidev.repositories.user;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidev.entities.user.RefreshToken;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends MongoRepository<RefreshToken, String> {

    Optional<RefreshToken> findByTokenHashAndRevokedAtIsNull(String tokenHash);

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    List<RefreshToken> findByAccountIdAndRevokedAtIsNull(String accountId);

    long countByAccountIdAndRevokedAtIsNull(String accountId);

    List<RefreshToken> findByAccountIdAndRevokedAtIsNull(String accountId, Sort sort);
}


