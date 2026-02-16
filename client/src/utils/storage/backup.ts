import type { Message, StorageData } from '../types';
import { STORAGE_KEY, BACKUP_KEY } from './constants';

/**
 * Load messages from backup storage
 */
export function loadBackup(): Message[] {
    try {
        const backup = localStorage.getItem(BACKUP_KEY);
        if (!backup) return [];

        const data: StorageData = JSON.parse(backup);
        return Array.isArray(data.messages) ? data.messages : [];
    } catch (error) {
        console.error('Failed to load backup:', error);
        return [];
    }
}

/**
 * Create a backup of current data
 */
export function createBackup(): void {
    try {
        const current = localStorage.getItem(STORAGE_KEY);
        if (current) {
            localStorage.setItem(BACKUP_KEY, current);
        }
    } catch (error) {
        console.error('Failed to create backup:', error);
    }
}
