import type { Message } from './Message';

/**
 * Storage Data structure
 * Contains messages along with metadata for versioning and tracking
 */
export interface StorageData {
    messages: Message[];
    version: string;
    lastSaved: number;
    messageCount: number;
}
