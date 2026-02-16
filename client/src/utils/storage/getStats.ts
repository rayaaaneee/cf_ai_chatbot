import type { StorageData } from '../types';
import { STORAGE_KEY } from './constants';

/**
 * Get storage statistics
 */
export function getStats(): { size: number; messageCount: number; lastSaved: number | null } {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return { size: 0, messageCount: 0, lastSaved: null };

        const data: StorageData = JSON.parse(stored);
        const size = new Blob([stored]).size;

        return {
            size,
            messageCount: data.messageCount,
            lastSaved: data.lastSaved,
        };
    } catch {
        return { size: 0, messageCount: 0, lastSaved: null };
    }
}
