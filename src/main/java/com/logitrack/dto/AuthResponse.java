package com.logitrack.dto;

public record AuthResponse(String token, long expiresInMs) {
}
