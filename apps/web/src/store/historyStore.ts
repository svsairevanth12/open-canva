import { useSyncExternalStore } from 'react';

import type { HistoryCommand } from '../types/editor';

type HistoryState = {
  canRedo: boolean;
  canUndo: boolean;
  cursor: number;
  size: number;
};

type HistorySubscriber = () => void;

function createHistoryStore() {
  /**
   * var: none
   * type: void
   * desc: Creates command history store with undo and redo execution helpers.
   */
  const subscribers = new Set<HistorySubscriber>();
  let cursor = -1;
  let stack: HistoryCommand[] = [];

  const notify = (): void => {
    /**
     * var: none
     * type: void
     * desc: Triggers update notifications for subscribed listeners.
     */
    subscribers.forEach((subscriber) => subscriber());
  };

  return {
    execute: async (command: HistoryCommand): Promise<void> => {
      /**
       * var: command
       * type: HistoryCommand
       * desc: Command object containing do and undo handlers.
       */
      const trimmed = stack.slice(0, cursor + 1);
      await command.do();
      stack = [...trimmed, command];
      cursor = stack.length - 1;
      notify();
    },
    getSnapshot: (): HistoryState => ({
      canRedo: cursor < stack.length - 1,
      canUndo: cursor >= 0,
      cursor,
      size: stack.length
    }),
    redo: async (): Promise<void> => {
      /**
       * var: none
       * type: void
       * desc: Re-executes next command in history stack when available.
       */
      if (cursor >= stack.length - 1) {
        return;
      }
      const nextIndex = cursor + 1;
      const command = stack[nextIndex];
      await command.do();
      cursor = nextIndex;
      notify();
    },
    subscribe: (subscriber: HistorySubscriber): (() => void) => {
      /**
       * var: subscriber
       * type: HistorySubscriber
       * desc: Listener callback subscribed to history mutations.
       */
      subscribers.add(subscriber);
      return () => {
        subscribers.delete(subscriber);
      };
    },
    undo: async (): Promise<void> => {
      /**
       * var: none
       * type: void
       * desc: Executes undo operation for current command when possible.
       */
      if (cursor < 0) {
        return;
      }
      const command = stack[cursor];
      await command.undo();
      cursor -= 1;
      notify();
    }
  };
}

const historyStore = createHistoryStore();

function useHistorySnapshot(): HistoryState {
  /**
   * var: none
   * type: void
   * desc: React subscription hook returning current history state.
   */
  return useSyncExternalStore(historyStore.subscribe, historyStore.getSnapshot, historyStore.getSnapshot);
}

export {
  historyStore,
  useHistorySnapshot
};
