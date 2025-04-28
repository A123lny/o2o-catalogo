import { DatabaseStorage } from "./database-storage";

// Esportiamo direttamente l'istanza di DatabaseStorage
export const storage = new DatabaseStorage();

// Re-esportiamo l'interfaccia IStorage dal database-storage
export type { IStorage } from "./database-storage";