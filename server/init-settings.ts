import { db } from './db';
import {
  generalSettings,
  securitySettings,
} from '@shared/schema';

async function initializeSettings() {
  console.log("Inizializzazione delle impostazioni predefinite...");

  try {
    // Crea le impostazioni generali predefinite se non esistono
    const existingGeneralSettings = await db.select().from(generalSettings);
    if (existingGeneralSettings.length === 0) {
      await db.insert(generalSettings).values({
        siteName: "o2o Mobility",
        primaryColor: "#3b82f6",
        secondaryColor: "#f97316",
        footerText: "© 2023 o2o Mobility. Tutti i diritti riservati."
      });
      console.log("Impostazioni generali predefinite create");
    } else {
      console.log("Impostazioni generali già presenti nel database");
    }

    // Crea le impostazioni di sicurezza predefinite se non esistono
    const existingSecuritySettings = await db.select().from(securitySettings);
    if (existingSecuritySettings.length === 0) {
      await db.insert(securitySettings).values({
        passwordExpiryDays: 90,
        minPasswordLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecialChar: true,
        passwordHistoryCount: 5,
        enable2FA: false,
        failedLoginAttempts: 5,
        lockoutDurationMinutes: 30
      });
      console.log("Impostazioni di sicurezza predefinite create");
    } else {
      console.log("Impostazioni di sicurezza già presenti nel database");
    }

    console.log("Inizializzazione completata con successo!");
  } catch (error) {
    console.error("Errore durante l'inizializzazione delle impostazioni:", error);
  }
}

initializeSettings().catch(console.error);