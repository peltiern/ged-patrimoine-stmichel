package fr.patrimoine.stmichel.ged.configuration.security;

import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

@Aspect
@Component
public class TokenAspect {

    @Value("${application.api.token}")
    private String apiToken;

    @Before("@annotation(fr.patrimoine.stmichel.ged.configuration.security.Protected)")
    public void checkToken(JoinPoint joinPoint) {
        ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        if (attrs == null) {
            throw new SecurityException("Aucune requête HTTP active");
        }

        HttpServletRequest request = attrs.getRequest();

        String header = request.getHeader("Authorization");

        if (header == null || !header.equals("Bearer " + apiToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalide");
        }
    }
}
