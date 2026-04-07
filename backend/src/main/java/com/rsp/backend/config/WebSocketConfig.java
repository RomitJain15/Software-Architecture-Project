package com.rsp.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WsHandshakeInterceptor wsHandshakeInterceptor;
    @Value("${app.frontend.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String[] allowedOrigins;

    public WebSocketConfig(WsHandshakeInterceptor wsHandshakeInterceptor) {
        this.wsHandshakeInterceptor = wsHandshakeInterceptor;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .addInterceptors(wsHandshakeInterceptor)
                .setHandshakeHandler(new WsHandshakeHandler())
                .setAllowedOrigins(allowedOrigins)
                .withSockJS();
    }
}