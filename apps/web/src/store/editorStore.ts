import { useSyncExternalStore } from 'react';

import type {
  EditorSelection,
  EditorSnapshot,
  LayerItem,
  ProjectDocument,
  ProjectObject,
  ProjectPage
} from '../types/editor';

type EditorStoreState = {
  activePageId: string;
  project: ProjectDocument;
  selection: EditorSelection;
};

type EditorStoreSubscriber = () => void;

function createDefaultProject(): ProjectDocument {
  /**
   * var: none
   * type: void
   * desc: Builds baseline project document used during editor bootstrap.
   */
  const firstPage: ProjectPage = {
    id: 'page-1',
    name: 'Page 1',
    objects: []
  };
  return {
    id: 'project-1',
    name: 'Untitled design',
    pages: [firstPage],
    updatedAt: new Date().toISOString(),
    version: 1
  };
}

function getActivePage(project: ProjectDocument, activePageId: string): ProjectPage {
  /**
   * var: project
   * type: ProjectDocument
   * desc: Project source used to resolve current page.
   * var: activePageId
   * type: string
   * desc: Target page identifier.
   */
  return project.pages.find((page) => page.id === activePageId) ?? project.pages[0];
}

function buildLayers(page: ProjectPage): LayerItem[] {
  /**
   * var: page
   * type: ProjectPage
   * desc: Current page used to derive layer list.
   */
  return [...page.objects]
    .sort((left, right) => right.layer - left.layer)
    .map((object) => ({
      id: object.id,
      isLocked: object.locked,
      isVisible: object.visible,
      label: `${object.kind} · ${object.id}`,
      type: object.kind
    }));
}

function createEditorStore() {
  /**
   * var: none
   * type: void
   * desc: Creates editor store with mutation APIs and subscription primitives.
   */
  const subscribers = new Set<EditorStoreSubscriber>();
  let state: EditorStoreState = {
    activePageId: 'page-1',
    project: createDefaultProject(),
    selection: {
      activeGroup: null,
      activeObject: null,
      isEditingGroup: false
    }
  };

  const notify = (): void => {
    /**
     * var: none
     * type: void
     * desc: Notifies subscribers after state mutation.
     */
    subscribers.forEach((subscriber) => subscriber());
  };

  const setState = (nextState: EditorStoreState): void => {
    /**
     * var: nextState
     * type: EditorStoreState
     * desc: Next immutable state payload for store.
     */
    state = nextState;
    notify();
  };

  const updatePage = (updater: (page: ProjectPage) => ProjectPage): void => {
    /**
     * var: updater
     * type: (page: ProjectPage) => ProjectPage
     * desc: Reducer callback mutating current active page.
     */
    const activePage = getActivePage(state.project, state.activePageId);
    const nextPage = updater(activePage);
    const nextPages = state.project.pages.map((page) => (page.id === nextPage.id ? nextPage : page));
    setState({
      ...state,
      project: {
        ...state.project,
        pages: nextPages,
        updatedAt: new Date().toISOString(),
        version: state.project.version + 1
      }
    });
  };

  return {
    addPage: (): void => {
      /**
       * var: none
       * type: void
       * desc: Adds new page and switches active pointer to created page.
       */
      const nextPage: ProjectPage = {
        id: `page-${Date.now()}`,
        name: `Page ${state.project.pages.length + 1}`,
        objects: []
      };
      setState({
        ...state,
        activePageId: nextPage.id,
        project: {
          ...state.project,
          pages: [...state.project.pages, nextPage],
          updatedAt: new Date().toISOString(),
          version: state.project.version + 1
        }
      });
    },
    addProjectObject: (object: ProjectObject): void => {
      /**
       * var: object
       * type: ProjectObject
       * desc: New object representation inserted into active page layer stack.
       */
      updatePage((page) => ({
        ...page,
        objects: [...page.objects, object]
      }));
    },
    deleteObject: (objectId: string): void => {
      /**
       * var: objectId
       * type: string
       * desc: Object identifier removed from active page.
       */
      updatePage((page) => ({
        ...page,
        objects: page.objects.filter((object) => object.id !== objectId)
      }));
    },
    duplicateObject: (objectId: string): void => {
      /**
       * var: objectId
       * type: string
       * desc: Object identifier duplicated with shifted layer and coordinates.
       */
      updatePage((page) => {
        const source = page.objects.find((object) => object.id === objectId);
        if (!source) {
          return page;
        }
        const clone: ProjectObject = {
          ...source,
          id: `${source.id}-copy-${Date.now()}`,
          layer: source.layer + 1,
          x: source.x + 12,
          y: source.y + 12
        };
        return {
          ...page,
          objects: [...page.objects, clone]
        };
      });
    },
    getSnapshot: (): EditorSnapshot => {
      /**
       * var: none
       * type: void
       * desc: Returns derived snapshot used by React UI selectors.
       */
      const activePage = getActivePage(state.project, state.activePageId);
      return {
        activePageId: state.activePageId,
        layers: buildLayers(activePage),
        project: state.project,
        selection: state.selection
      };
    },
    lockObject: (objectId: string, isLocked: boolean): void => {
      /**
       * var: objectId
       * type: string
       * desc: Object identifier for lock state update.
       * var: isLocked
       * type: boolean
       * desc: Next lock state for object.
       */
      updatePage((page) => ({
        ...page,
        objects: page.objects.map((object) => (object.id === objectId ? {
          ...object,
          locked: isLocked
        } : object))
      }));
    },
    reorderLayer: (objectId: string, direction: 'down' | 'up'): void => {
      /**
       * var: objectId
       * type: string
       * desc: Object identifier moved in page layer ordering.
       * var: direction
       * type: 'down' | 'up'
       * desc: Direction for layer move operation.
       */
      updatePage((page) => ({
        ...page,
        objects: page.objects.map((object) => {
          if (object.id !== objectId) {
            return object;
          }
          return {
            ...object,
            layer: direction === 'up' ? object.layer + 1 : Math.max(0, object.layer - 1)
          };
        })
      }));
    },
    select: (selection: EditorSelection): void => {
      /**
       * var: selection
       * type: EditorSelection
       * desc: Selection payload synchronized from Fabric interactions.
       */
      setState({
        ...state,
        selection
      });
    },
    setPage: (pageId: string): void => {
      /**
       * var: pageId
       * type: string
       * desc: Existing page identifier switched as active page.
       */
      if (!state.project.pages.some((page) => page.id === pageId)) {
        return;
      }
      setState({
        ...state,
        activePageId: pageId
      });
    },
    subscribe: (subscriber: EditorStoreSubscriber): (() => void) => {
      /**
       * var: subscriber
       * type: EditorStoreSubscriber
       * desc: Listener callback receiving store updates.
       */
      subscribers.add(subscriber);
      return () => {
        subscribers.delete(subscriber);
      };
    },
    toggleVisibility: (objectId: string): void => {
      /**
       * var: objectId
       * type: string
       * desc: Object identifier toggled visible or hidden.
       */
      updatePage((page) => ({
        ...page,
        objects: page.objects.map((object) => (object.id === objectId ? {
          ...object,
          visible: !object.visible
        } : object))
      }));
    },
    updateObject: (objectId: string, patch: Partial<ProjectObject>): void => {
      /**
       * var: objectId
       * type: string
       * desc: Object identifier updated with partial patch data.
       * var: patch
       * type: Partial<ProjectObject>
       * desc: Partial project object patch.
       */
      updatePage((page) => ({
        ...page,
        objects: page.objects.map((object) => (object.id === objectId ? {
          ...object,
          ...patch
        } : object))
      }));
    }
  };
}

const editorStore = createEditorStore();

function useEditorSnapshot(): EditorSnapshot {
  /**
   * var: none
   * type: void
   * desc: React subscription hook returning latest editor snapshot.
   */
  return useSyncExternalStore(editorStore.subscribe, editorStore.getSnapshot, editorStore.getSnapshot);
}

export {
  editorStore,
  useEditorSnapshot
};
