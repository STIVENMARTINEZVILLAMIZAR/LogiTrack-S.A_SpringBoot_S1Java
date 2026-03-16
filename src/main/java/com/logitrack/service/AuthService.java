package com.logitrack.service;

import com.logitrack.dto.AuthRequest;
import com.logitrack.dto.AuthResponse;
import com.logitrack.dto.RegisterRequest;

public interface AuthService {
    AuthResponse login(AuthRequest request);
    AuthResponse register(RegisterRequest request);
}
