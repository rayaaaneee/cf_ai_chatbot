/**
 * Utils index
 * Main entry point for all utility functions and types
 */

// Export all types
export type { Message, StorageData } from './types';

// Export all storage functions
export {
    loadMessages,
    saveMessages,
    createBackup,
    loadBackup,
    clearAll,
    exportMessages,
    importMessages,
    getStats,
    STORAGE_KEY,
    BACKUP_KEY,
    VERSION,
} from './storage';
