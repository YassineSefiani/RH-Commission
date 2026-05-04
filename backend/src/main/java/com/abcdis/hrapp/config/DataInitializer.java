package com.abcdis.hrapp.config;

import com.abcdis.hrapp.model.User;
import com.abcdis.hrapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Créer l'utilisateur admin par défaut s'il n'existe pas
        if (!userRepository.existsByEmail("yassinesefiani@gmail.com")) {
            User admin = new User();
            admin.setEmail("yassinesefiani@gmail.com");
            admin.setPassword(passwordEncoder.encode("123456"));
            admin.setSuperRole("ADMIN");
            admin.setNom("Sefiani");
            admin.setPrenom("Yassine");
            admin.setActif(true);
            userRepository.save(admin);
            System.out.println("✅ Utilisateur admin créé: yassinesefiani@gmail.com / 123456");
        }
        
        // Créer l'utilisateur ADV par défaut s'il n'existe pas
        if (!userRepository.existsByEmail("adv@abcdis.com")) {
            User adv = new User();
            adv.setEmail("adv@abcdis.com");
            adv.setPassword(passwordEncoder.encode("123456"));
            adv.setSuperRole("ADV");
            adv.setNom("BEN");
            adv.setPrenom("Ali");
            adv.setActif(true);
            userRepository.save(adv);
            System.out.println("✅ Utilisateur ADV créé: adv@abcdis.com / 123456");
        }
        
        // Créer l'utilisateur RH par défaut s'il n'existe pas
        if (!userRepository.existsByEmail("rh@abcdis.com")) {
            User rh = new User();
            rh.setEmail("rh@abcdis.com");
            rh.setPassword(passwordEncoder.encode("123456"));
            rh.setSuperRole("RH");
            rh.setNom("KHAL");
            rh.setPrenom("Fatima");
            rh.setActif(true);
            userRepository.save(rh);
            System.out.println("✅ Utilisateur RH créé: rh@abcdis.com / 123456");
        }
        
        // Créer l'utilisateur DISPATCHER par défaut s'il n'existe pas
        if (!userRepository.existsByEmail("dispatcher@abcdis.com")) {
            User dispatcher = new User();
            dispatcher.setEmail("dispatcher@abcdis.com");
            dispatcher.setPassword(passwordEncoder.encode("123456"));
            dispatcher.setSuperRole("DISPATCHER");
            dispatcher.setNom("AMrani");
            dispatcher.setPrenom("Omar");
            dispatcher.setActif(true);
            userRepository.save(dispatcher);
            System.out.println("✅ Utilisateur DISPATCHER créé: dispatcher@abcdis.com / 123456");
        }
    }
}