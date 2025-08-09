package com.personalfit.personalfit.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.personalfit.personalfit.dto.InCreateUserDTO;
import com.personalfit.personalfit.dto.InFindByDniDTO;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.repository.IUserRepository;
import com.personalfit.personalfit.security.JwtService;
import com.personalfit.personalfit.utils.UserRole;
import com.personalfit.personalfit.utils.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@AutoConfigureWebMvc
@Transactional
class UserControllerIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private User adminUser;
    private String adminToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        objectMapper = new ObjectMapper();
        
        // Clean up any existing test data
        userRepository.deleteAll();
        
        // Create admin user for authenticated requests
        adminUser = new User();
        adminUser.setFirstName("Admin");
        adminUser.setLastName("User");
        adminUser.setDni(11111111);
        adminUser.setEmail("admin@personalfit.com");
        adminUser.setPassword(passwordEncoder.encode("admin123"));
        adminUser.setPhone("111111111");
        adminUser.setRole(UserRole.admin);
        adminUser.setStatus(UserStatus.active);
        adminUser.setJoinDate(LocalDate.now());
        adminUser = userRepository.save(adminUser);
        
        // Generate admin token
        adminToken = jwtService.generateToken(adminUser);
    }

    @Test
    void shouldCreateNewUserSuccessfully() throws Exception {
        InCreateUserDTO newUser = new InCreateUserDTO();
        newUser.setFirstName("John");
        newUser.setLastName("Doe");
        newUser.setDni("12345678");
        newUser.setEmail("john.doe@test.com");
        newUser.setPassword("password123");
        newUser.setPhone("123456789");
        newUser.setRole(UserRole.client);

        mockMvc.perform(post("/api/users/new")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newUser)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message", is("Usuario creado exitosamente")))
                .andExpect(jsonPath("$.success", is(true)));

        // Verify user was created in database
        assertTrue(userRepository.findByEmail("john.doe@test.com").isPresent());
    }

    @Test
    void shouldRejectUserWithDuplicateEmail() throws Exception {
        // Create first user
        User existingUser = new User();
        existingUser.setFirstName("Existing");
        existingUser.setLastName("User");
        existingUser.setDni(99999999);
        existingUser.setEmail("existing@test.com");
        existingUser.setPassword(passwordEncoder.encode("password123"));
        existingUser.setPhone("999999999");
        existingUser.setRole(UserRole.client);
        existingUser.setStatus(UserStatus.active);
        existingUser.setJoinDate(LocalDate.now());
        userRepository.save(existingUser);

        // Try to create user with same email
        InCreateUserDTO duplicateUser = new InCreateUserDTO();
        duplicateUser.setFirstName("Duplicate");
        duplicateUser.setLastName("User");
        duplicateUser.setDni("88888888");
        duplicateUser.setEmail("existing@test.com"); // Same email
        duplicateUser.setPassword("password123");
        duplicateUser.setPhone("888888888");
        duplicateUser.setRole(UserRole.client);

        mockMvc.perform(post("/api/users/new")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicateUser)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectUserWithDuplicateDni() throws Exception {
        // Create first user
        User existingUser = new User();
        existingUser.setFirstName("Existing");
        existingUser.setLastName("User");
        existingUser.setDni(77777777);
        existingUser.setEmail("existing@test.com");
        existingUser.setPassword(passwordEncoder.encode("password123"));
        existingUser.setPhone("777777777");
        existingUser.setRole(UserRole.client);
        existingUser.setStatus(UserStatus.active);
        existingUser.setJoinDate(LocalDate.now());
        userRepository.save(existingUser);

        // Try to create user with same DNI
        InCreateUserDTO duplicateUser = new InCreateUserDTO();
        duplicateUser.setFirstName("Duplicate");
        duplicateUser.setLastName("User");
        duplicateUser.setDni("77777777"); // Same DNI
        duplicateUser.setEmail("different@test.com");
        duplicateUser.setPassword("password123");
        duplicateUser.setPhone("666666666");
        duplicateUser.setRole(UserRole.client);

        mockMvc.perform(post("/api/users/new")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicateUser)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldValidateRequiredFields() throws Exception {
        InCreateUserDTO invalidUser = new InCreateUserDTO();
        // Missing required fields

        mockMvc.perform(post("/api/users/new")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidUser)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldValidateEmailFormat() throws Exception {
        InCreateUserDTO invalidUser = new InCreateUserDTO();
        invalidUser.setFirstName("John");
        invalidUser.setLastName("Doe");
        invalidUser.setDni("12345678");
        invalidUser.setEmail("invalid-email-format");
        invalidUser.setPassword("password123");
        invalidUser.setPhone("123456789");
        invalidUser.setRole(UserRole.client);

        mockMvc.perform(post("/api/users/new")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidUser)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldGetAllUsers() throws Exception {
        // Create some test users
        User user1 = createTestUser("User1", "Test", "11111111", "user1@test.com");
        User user2 = createTestUser("User2", "Test", "22222222", "user2@test.com");
        userRepository.save(user1);
        userRepository.save(user2);

        mockMvc.perform(get("/api/users/all")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$[*].email", hasItems("user1@test.com", "user2@test.com")));
    }

    @Test
    void shouldFindUserByDni() throws Exception {
        User testUser = createTestUser("Test", "User", "33333333", "test@user.com");
        testUser = userRepository.save(testUser);

        InFindByDniDTO findRequest = new InFindByDniDTO();
        findRequest.setDni(33333333);

        mockMvc.perform(post("/api/users/find")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(findRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dni", is("33333333")))
                .andExpect(jsonPath("$.email", is("test@user.com")));
    }

    @Test
    void shouldReturnNotFoundForNonExistentDni() throws Exception {
        InFindByDniDTO findRequest = new InFindByDniDTO();
        findRequest.setDni(99999999);

        mockMvc.perform(post("/api/users/find")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(findRequest)))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldGetUserById() throws Exception {
        User testUser = createTestUser("Test", "User", "44444444", "testid@user.com");
        testUser = userRepository.save(testUser);

        mockMvc.perform(get("/api/users/" + testUser.getId())
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(testUser.getId().intValue())))
                .andExpect(jsonPath("$.email", is("testid@user.com")));
    }

    @Test
    void shouldReturnNotFoundForInvalidUserId() throws Exception {
        mockMvc.perform(get("/api/users/99999")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldUpdateUser() throws Exception {
        User testUser = createTestUser("Original", "Name", "55555555", "original@user.com");
        testUser = userRepository.save(testUser);

        InCreateUserDTO updateRequest = new InCreateUserDTO();
        updateRequest.setFirstName("Updated");
        updateRequest.setLastName("Name");
        updateRequest.setDni("55555555");
        updateRequest.setEmail("updated@user.com");
        updateRequest.setPassword("newpassword123");
        updateRequest.setPhone("555555555");
        updateRequest.setRole(UserRole.client);

        mockMvc.perform(put("/api/users/" + testUser.getId())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("actualizado")));

        // Verify update in database
        User updatedUser = userRepository.findById(testUser.getId()).orElse(null);
        assertNotNull(updatedUser);
        assertEquals("Updated", updatedUser.getFirstName());
        assertEquals("updated@user.com", updatedUser.getEmail());
    }

    @Test
    void shouldDeleteUser() throws Exception {
        User testUser = createTestUser("To Delete", "User", "66666666", "delete@user.com");
        testUser = userRepository.save(testUser);

        mockMvc.perform(delete("/api/users/" + testUser.getId())
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("eliminado")));

        // Verify deletion in database
        assertFalse(userRepository.findById(testUser.getId()).isPresent());
    }

    @Test
    void shouldRequireAuthenticationForProtectedEndpoints() throws Exception {
        InCreateUserDTO newUser = new InCreateUserDTO();
        newUser.setFirstName("John");
        newUser.setLastName("Doe");
        newUser.setDni("12345678");
        newUser.setEmail("john.doe@test.com");
        newUser.setPassword("password123");
        newUser.setPhone("123456789");
        newUser.setRole(UserRole.client);

        mockMvc.perform(post("/api/users/new")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newUser)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldTestFailEndpoint() throws Exception {
        mockMvc.perform(get("/api/users/fail")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    private User createTestUser(String name, String surname, String dni, String email) {
        User user = new User();
        user.setFirstName(name);
        user.setLastName(surname);
        user.setDni(Integer.parseInt(dni));
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode("password123"));
        user.setPhone("123456789");
        user.setRole(UserRole.client);
        user.setStatus(UserStatus.active);
        user.setJoinDate(LocalDate.now());
        return user;
    }
}
