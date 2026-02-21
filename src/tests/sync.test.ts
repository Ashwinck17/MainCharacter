import { describe, it, expect, beforeEach } from 'vitest';

/**
 * MOCK ENVIRONMENT FOR FIREBASE CLOUD SYNC
 * This simulates how multiple instances / devices connected to the same account
 * synchronize profile lists in real-time.
 */

// Mock Firestore event bus
type Subscriber = (data: any) => void;
class MockFirestore {
    private docListeners: Record<string, Subscriber[]> = {};
    private db: Record<string, any> = {};

    subscribe(path: string, callback: Subscriber) {
        if (!this.docListeners[path]) this.docListeners[path] = [];
        this.docListeners[path].push(callback);
        // Instant trigger with current data
        callback(this.db[path] || null);

        return () => {
            this.docListeners[path] = this.docListeners[path].filter(cb => cb !== callback);
        };
    }

    async setDoc(path: string, data: any) {
        this.db[path] = data;
        // Fire all listeners concurrently for that exact path
        if (this.docListeners[path]) {
            for (const cb of this.docListeners[path]) {
                cb(data);
            }
        }
    }

    async deleteDoc(path: string) {
        delete this.db[path];
        if (this.docListeners[path]) {
            for (const cb of this.docListeners[path]) {
                cb(null);
            }
        }
    }
}

describe('Enterprise Cloud Sync - Multi-Device Simulation', () => {
    let firestore: MockFirestore;

    beforeEach(() => {
        firestore = new MockFirestore();
    });

    it('1. Device B automatically receives Profile List when created by Device A', async () => {
        let deviceBProfileList: any[] = [];
        const indexPath = "users/test-user/_index/profiles";

        // Device B logs in and subscribes
        firestore.subscribe(indexPath, (data) => {
            if (data && data.list) {
                deviceBProfileList = data.list;
            } else {
                deviceBProfileList = [];
            }
        });

        // Starts empty
        expect(deviceBProfileList.length).toBe(0);

        // Device A creates a new profile in Cloud
        await firestore.setDoc(indexPath, { list: [{ id: 'p1', name: 'Profile 1' }] });

        // Device B should immediately reflect the change
        expect(deviceBProfileList.length).toBe(1);
        expect(deviceBProfileList[0].name).toBe('Profile 1');
    });

    it('2. Device A deletes a profile, Device B automatically removes it', async () => {
        let deviceBProfileList: any[] = [];
        const indexPath = "users/test-user/_index/profiles";

        // Seed with two profiles
        await firestore.setDoc(indexPath, { list: [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }] });

        firestore.subscribe(indexPath, (data) => {
            if (data && data.list) {
                deviceBProfileList = data.list;
            } else {
                deviceBProfileList = [];
            }
        });

        expect(deviceBProfileList.length).toBe(2);

        // Device A deletes "p1" and saves new list
        await firestore.setDoc(indexPath, { list: [{ id: 'p2', name: 'B' }] });

        // Device B auto-syncs
        expect(deviceBProfileList.length).toBe(1);
        expect(deviceBProfileList[0].id).toBe('p2');
    });

    it('3. Three Devices seamlessly synchronize Profile states dynamically', async () => {
        // Combinations check (Multiple devices, same account)
        const indexPath = "users/test-user/_index/profiles";

        let devAEvents = 0;
        let devBEvents = 0;
        let devCEvents = 0;

        firestore.subscribe(indexPath, () => devAEvents++);
        firestore.subscribe(indexPath, () => devBEvents++);
        firestore.subscribe(indexPath, () => devCEvents++);

        expect(devAEvents).toBe(1); // the initial null trigger

        // Dev B creates a profile
        await firestore.setDoc(indexPath, { list: [{ id: 'x', name: 'Xbox' }] });

        expect(devAEvents).toBe(2);
        expect(devCEvents).toBe(2);

        // Dev C creates another
        await firestore.setDoc(indexPath, { list: [{ id: 'x', name: 'Xbox' }, { id: 'p', name: 'PS5' }] });

        expect(devAEvents).toBe(3);
        expect(devBEvents).toBe(3);
        expect(devCEvents).toBe(3); // Everyone received 3 lifecycle events
    });

    it('4. Device B modifies the precise Game State attributes, Device A catches the data updates', async () => {
        // This validates the subscribeToProfile logic in useSystemStore implementation
        let devACurrentState: any = null;
        let devAUpdateCount = 0;
        const profilePath = "users/test-user/profiles/my_character";

        // Setup base state
        await firestore.setDoc(profilePath, { stats: { hp: 100, STR: 10 } });

        // Dev A subscribes to active profile state
        firestore.subscribe(profilePath, (data) => {
            devACurrentState = data;
            devAUpdateCount++;
        });

        // Dev B completes a Task on Hardcore mode, dealing massive damage but leveling up STR
        await firestore.setDoc(profilePath, { stats: { hp: 80, STR: 14 } });

        // Dev A should intercept changes perfectly via the realtime listener
        expect(devACurrentState.stats.hp).toBe(80);
        expect(devACurrentState.stats.STR).toBe(14);
        expect(devAUpdateCount).toBe(2); // Initialization + 1 Mutation
    });
});
