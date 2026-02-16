import { STORAGE_KEY, BACKUP_KEY } from './constants';

/**
 * Clear all messages from localStorage
 * Removes both main storage and backup
 */
export function clearAll(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(BACKUP_KEY);
    } catch (error) {
        console.error('Failed to clear storage:', error);
    }
}
