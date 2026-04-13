package com.finflow.core.auth.service;

import com.finflow.core.family.domain.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKet;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secretKet.getBytes());
    }

    public String generateToken(User user) {
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("fullName", user.getFullName())
                .claim("role", user.getRole().name())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24))
                .signWith(getSigningKey())
                .compact();
    }
}
