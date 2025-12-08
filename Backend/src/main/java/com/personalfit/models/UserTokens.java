package com.personalfit.models;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "user_tokens")
public class UserTokens {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", unique = true, nullable = false)
    private Long userId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_fcm_tokens", joinColumns = @JoinColumn(name = "user_tokens_id"))
    @Column(name = "token")
    @Builder.Default
    private List<String> tokens = new ArrayList<>();

    public void addToken(String token) {
        if (!this.tokens.contains(token)) {
            this.tokens.add(token);
        }
    }

    public void removeToken(String token) {
        this.tokens.remove(token);
    }
}
