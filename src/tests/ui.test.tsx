// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Quests } from '../features/quests/Quests';
import { useSystemStore } from '../store/useSystemStore';
import React from 'react';

// Mock the global Zustand store to inject any edge cases we want into the DOM
vi.mock('../store/useSystemStore', () => ({
    useSystemStore: vi.fn(),
}));

// Mock framer-motion so animations don't block DOM parsing
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className }: any) => <div className={className}>{children}</div>,
    },
}));

// Prevent WebAudio API from crashing JSDOM headless environments
vi.mock('../utils/audioSystem', () => ({
    audio: {
        playSuccess: vi.fn(),
        playTap: vi.fn(),
        playError: vi.fn(),
        playLevelUp: vi.fn()
    }
}));


describe('ISTQB Negative & Positive UI Flow Validations - <Quests /> component', () => {

    it('1. POSITIVE CASE - Mathematically validates that Medium Difficulty evaluates dynamically to +2 STAT and +2 BONUS on the Quests GUI', () => {
        // Arrange
        const mockTask = {
            id: 'mock-med',
            type: 'physical',
            difficulty: 'Medium',
            description: 'A 20 min Medium Task',
            xpReward: 50,
            completed: false,
        };

        const mockState = {
            startDate: new Date().toISOString(),
            dailyTasks: [mockTask]
        };

        (useSystemStore as any).mockReturnValue({ state: mockState, completeTask: vi.fn() });

        // Act
        render(<Quests />);

        // Assert - Look for the rendered UI text mapping the output logic
        // Because diff is Medium, gameLogic implies we receive +2
        expect(screen.getByText('STAT: +2 STRENGTH')).toBeDefined();
        expect(screen.getByText('BONUS: +2 DISC/FOCUS')).toBeDefined();
    });

    it('2. POSITIVE CASE - Mathematically validates that Easy Difficulty properly calculates to +1 STAT and +1 BONUS natively on the UI', () => {
        const mockTask = {
            id: 'mock-ez',
            type: 'mental',
            difficulty: 'Easy',
            description: 'A 10 min Easy Book Read',
            xpReward: 40,
            completed: false,
        };

        const mockState = {
            startDate: new Date().toISOString(),
            dailyTasks: [mockTask]
        };

        (useSystemStore as any).mockReturnValue({ state: mockState, completeTask: vi.fn() });

        render(<Quests />);

        // Assert
        expect(screen.getByText('STAT: +1 INTELLIGENCE')).toBeDefined();
        expect(screen.getByText('BONUS: +1 DISC/FOCUS')).toBeDefined();
    });

    it('3. NEGATIVE/EDGE CASE - Hardcore Multipliers for Maximum +4 Yield are mapped correctly', () => {
        const mockTask = {
            id: 'mock-hard',
            type: 'physical',
            difficulty: 'Hard',
            description: 'Insane 60Min Workout',
            xpReward: 100,
            completed: false,
        };

        const mockState = {
            startDate: new Date().toISOString(),
            dailyTasks: [mockTask]
        };

        (useSystemStore as any).mockReturnValue({ state: mockState, completeTask: vi.fn() });

        render(<Quests />);

        // Assert
        expect(screen.getByText('STAT: +4 STRENGTH')).toBeDefined();
        expect(screen.getByText('BONUS: +3 DISC/FOCUS')).toBeDefined();
    });
});
