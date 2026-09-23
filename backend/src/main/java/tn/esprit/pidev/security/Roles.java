package tn.esprit.pidev.security;

import tn.esprit.pidev.entities.user.AccountRole;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to restrict endpoint access by role.
 * Usage: @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Roles {
    AccountRole[] value();
}

