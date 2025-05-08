import { Request, Response } from "express";
import { db } from "../db";
import { emailConfig } from "@shared/schema";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";

// Get Email configuration
export const getEmailConfig = async (req: Request, res: Response) => {
  try {
    const config = await db.select().from(emailConfig).limit(1);
    
    if (config.length === 0) {
      // Create a default configuration if none exists
      const [defaultConfig] = await db.insert(emailConfig).values({
        enabled: false,
        provider: "smtp",
        host: "",
        port: 587,
        secure: false,
        username: "",
        password: "",
        fromEmail: "",
      }).returning();
      
      return res.status(200).json(defaultConfig);
    }
    
    return res.status(200).json(config[0]);
  } catch (error) {
    console.error("Error getting email configuration:", error);
    return res.status(500).json({ error: "Errore nel recupero della configurazione email" });
  }
};

// Update Email configuration
export const updateEmailConfig = async (req: Request, res: Response) => {
  try {
    const { id, ...data } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: "ID configurazione non specificato" });
    }
    
    const [updatedConfig] = await db
      .update(emailConfig)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(emailConfig.id, id))
      .returning();
    
    return res.status(200).json(updatedConfig);
  } catch (error) {
    console.error("Error updating email configuration:", error);
    return res.status(500).json({ error: "Errore nell'aggiornamento della configurazione email" });
  }
};

// Test Email sending
export const testEmailSending = async (req: Request, res: Response) => {
  try {
    const { to, subject, message } = req.body;
    
    if (!to || !subject || !message) {
      return res.status(400).json({ error: "Destinatario, oggetto e messaggio sono obbligatori" });
    }
    
    // Get the email configuration
    const [config] = await db.select().from(emailConfig).limit(1);
    
    if (!config) {
      return res.status(404).json({ error: "Configurazione email non trovata" });
    }
    
    if (!config.enabled) {
      return res.status(400).json({ error: "La configurazione email non è attiva" });
    }
    
    // Send email based on the provider
    if (config.provider === "smtp") {
      // Create a transport
      const transport = nodemailer.createTransport({
        host: config.host,
        port: config.port || 587,
        secure: config.secure || false,
        auth: {
          user: config.username,
          pass: config.password,
        },
      });
      
      // Send email
      await transport.sendMail({
        from: config.fromEmail,
        to,
        subject,
        text: message,
      });
    } else if (config.provider === "sendgrid") {
      // Set the API key
      sgMail.setApiKey(config.sendgridApiKey || "");
      
      // Send email
      await sgMail.send({
        from: config.fromEmail,
        to,
        subject,
        text: message,
      });
    } else {
      return res.status(400).json({ error: "Provider email non supportato" });
    }
    
    return res.status(200).json({ success: true, message: "Email inviata con successo" });
  } catch (error) {
    console.error("Error sending test email:", error);
    return res.status(500).json({ error: "Errore nell'invio dell'email di test", details: error.message });
  }
};