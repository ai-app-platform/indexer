import { FileEntry } from '../core/indexer';
import { CodeIndex, CodeFile, CodeSymbol, CodeReference, CodeChunk, CodeDependency, Language } from '../types/code-index';

/**
 * Mock data for demo purposes
 * In production, this would come from actual Git repository
 */

export const MOCK_JAVA_FILES: FileEntry[] = [
  {
    path: 'src/main/java/com/example/payment/PaymentService.java',
    name: 'PaymentService.java',
    size: 2400,
    lastModified: '2025-01-15T10:30:00Z',
    content: `package com.example.payment;

import com.example.payment.model.PaymentRequest;
import com.example.payment.model.PaymentResponse;
import com.example.payment.repository.PaymentRepository;
import com.example.user.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.List;

@Service
@Transactional
public class PaymentService implements PaymentProcessor {
    
    private final PaymentRepository paymentRepository;
    private final UserService userService;
    
    public PaymentService(PaymentRepository paymentRepository, UserService userService) {
        this.paymentRepository = paymentRepository;
        this.userService = userService;
    }
    
    public PaymentResponse authorize(PaymentRequest request) {
        userService.validateUser(request.getUserId());
        PaymentResponse response = new PaymentResponse();
        response.setStatus("AUTHORIZED");
        paymentRepository.save(response);
        return response;
    }
    
    public PaymentResponse capture(String transactionId) {
        Optional<PaymentResponse> payment = paymentRepository.findById(transactionId);
        if (payment.isPresent()) {
            payment.get().setStatus("CAPTURED");
            paymentRepository.save(payment.get());
        }
        return payment.orElse(null);
    }
    
    public List<PaymentResponse> getPaymentsByUser(Long userId) {
        return paymentRepository.findByUserId(userId);
    }
}`,
  },
  {
    path: 'src/main/java/com/example/payment/PaymentController.java',
    name: 'PaymentController.java',
    size: 1800,
    lastModified: '2025-01-15T10:30:00Z',
    content: `package com.example.payment;

import com.example.payment.model.PaymentRequest;
import com.example.payment.model.PaymentResponse;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    
    private final PaymentService paymentService;
    
    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }
    
    @PostMapping("/authorize")
    public PaymentResponse authorize(@Valid @RequestBody PaymentRequest request) {
        return paymentService.authorize(request);
    }
    
    @PostMapping("/{transactionId}/capture")
    public PaymentResponse capture(@PathVariable String transactionId) {
        return paymentService.capture(transactionId);
    }
    
    @GetMapping("/user/{userId}")
    public List<PaymentResponse> getByUser(@PathVariable Long userId) {
        return paymentService.getPaymentsByUser(userId);
    }
}`,
  },
  {
    path: 'src/main/java/com/example/payment/PaymentProcessor.java',
    name: 'PaymentProcessor.java',
    size: 400,
    lastModified: '2025-01-15T10:30:00Z',
    content: `package com.example.payment;

import com.example.payment.model.PaymentRequest;
import com.example.payment.model.PaymentResponse;

public interface PaymentProcessor {
    PaymentResponse authorize(PaymentRequest request);
    PaymentResponse capture(String transactionId);
}`,
  },
  {
    path: 'src/main/java/com/example/payment/model/PaymentRequest.java',
    name: 'PaymentRequest.java',
    size: 800,
    lastModified: '2025-01-15T10:30:00Z',
    content: `package com.example.payment.model;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record PaymentRequest(
    @NotNull Long userId,
    @NotNull @Positive BigDecimal amount,
    String currency,
    String description
) {}`,
  },
  {
    path: 'src/main/java/com/example/payment/model/PaymentResponse.java',
    name: 'PaymentResponse.java',
    size: 600,
    lastModified: '2025-01-15T10:30:00Z',
    content: `package com.example.payment.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentResponse {
    private String id;
    private Long userId;
    private BigDecimal amount;
    private String status;
    private LocalDateTime createdAt;
    
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}`,
  },
  {
    path: 'src/main/java/com/example/payment/repository/PaymentRepository.java',
    name: 'PaymentRepository.java',
    size: 500,
    lastModified: '2025-01-15T10:30:00Z',
    content: `package com.example.payment.repository;

import com.example.payment.model.PaymentResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<PaymentResponse, String> {
    List<PaymentResponse> findByUserId(Long userId);
    List<PaymentResponse> findByStatus(String status);
}`,
  },
  {
    path: 'src/main/java/com/example/user/UserService.java',
    name: 'UserService.java',
    size: 1200,
    lastModified: '2025-01-15T10:30:00Z',
    content: `package com.example.user;

import com.example.user.model.User;
import com.example.user.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    
    private final UserRepository userRepository;
    
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    public void validateUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        if (!user.isActive()) {
            throw new RuntimeException("User is not active");
        }
    }
    
    public User getUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }
}`,
  },
  {
    path: 'src/main/java/com/example/user/model/User.java',
    name: 'User.java',
    size: 700,
    lastModified: '2025-01-15T10:30:00Z',
    content: `package com.example.user.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String email;
    private boolean active;
    
    public Long getId() { return id; }
    public String getName() { return name; }
    public boolean isActive() { return active; }
}`,
  },
  {
    path: 'src/main/java/com/example/user/repository/UserRepository.java',
    name: 'UserRepository.java',
    size: 300,
    lastModified: '2025-01-15T10:30:00Z',
    content: `package com.example.user.repository;

import com.example.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
}`,
  },
  {
    path: 'src/test/java/com/example/payment/PaymentServiceTest.java',
    name: 'PaymentServiceTest.java',
    size: 1500,
    lastModified: '2025-01-15T10:30:00Z',
    content: `package com.example.payment;

import com.example.payment.model.PaymentRequest;
import com.example.payment.model.PaymentResponse;
import com.example.payment.repository.PaymentRepository;
import com.example.user.UserService;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
import java.math.BigDecimal;

class PaymentServiceTest {
    
    @Test
    void shouldAuthorizePayment() {
        PaymentRepository repo = mock(PaymentRepository.class);
        UserService userService = mock(UserService.class);
        PaymentService service = new PaymentService(repo, userService);
        
        PaymentRequest request = new PaymentRequest(1L, new BigDecimal("100.00"), "USD", "Test");
        PaymentResponse response = service.authorize(request);
        
        assertNotNull(response);
        assertEquals("AUTHORIZED", response.getStatus());
        verify(userService).validateUser(1L);
        verify(repo).save(any());
    }
}`,
  },
];

export const MOCK_PROJECT_CONFIG = {
  projectId: 'project-demo-1',
  repositoryId: 'repo-demo-1',
  branch: 'main',
  commitSha: 'abc123def456',
  indexerVersion: '1.0.0',
};
