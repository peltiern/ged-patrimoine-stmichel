package fr.patrimoine.stmichel.ged;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class PatrimoineStmichelGedApplication {

    public static void main(String[] args) {
        SpringApplication.run(PatrimoineStmichelGedApplication.class, args);
    }

}
