import type {
  ProjectDocument,
  StoredDesign,
  StoredDesignKind
} from '../types/editor';

const PROJECTS_STORAGE_KEY = 'open-canva-projects-v1';

function inferKindFromFileName(fileName: string): StoredDesignKind {
  /**
   * var: fileName
   * type: string
   * desc: Input filename inspected to infer stored design kind.
   */
  return fileName.toLowerCase().endsWith('.svg') ? 'svg' : 'image';
}

function toStoredDesign(project: ProjectDocument): StoredDesign {
  /**
   * var: project
   * type: ProjectDocument
   * desc: Project document mapped to lightweight stored design card.
   */
  const firstPage = project.pages[0];
  const firstObject = firstPage?.objects[0];
  return {
    dataUrl: typeof firstObject?.data?.dataUrl === 'string' ? String(firstObject.data.dataUrl) : '',
    id: project.id,
    kind: inferKindFromFileName(project.name),
    name: project.name,
    updatedAt: project.updatedAt
  };
}

function loadProjects(): ProjectDocument[] {
  /**
   * var: none
   * type: void
   * desc: Restores project documents from versioned local storage key.
   */
  const rawValue = localStorage.getItem(PROJECTS_STORAGE_KEY);
  if (!rawValue) {
    return [];
  }
  try {
    const parsed = JSON.parse(rawValue) as ProjectDocument[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: ProjectDocument[]): void {
  /**
   * var: projects
   * type: ProjectDocument[]
   * desc: Project collection persisted to local storage.
   */
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

function listStoredDesigns(): StoredDesign[] {
  /**
   * var: none
   * type: void
   * desc: Returns design cards derived from persisted project documents.
   */
  return loadProjects().map(toStoredDesign);
}

function openProjectById(projectId: string): ProjectDocument | null {
  /**
   * var: projectId
   * type: string
   * desc: Project identifier used to retrieve single project payload.
   */
  return loadProjects().find((project) => project.id === projectId) ?? null;
}

function upsertProject(project: ProjectDocument): void {
  /**
   * var: project
   * type: ProjectDocument
   * desc: Project payload inserted or updated inside local storage collection.
   */
  const projects = loadProjects();
  const existingIndex = projects.findIndex((current) => current.id === project.id);
  if (existingIndex >= 0) {
    projects[existingIndex] = project;
  } else {
    projects.unshift(project);
  }
  saveProjects(projects.slice(0, 50));
}

export {
  listStoredDesigns,
  loadProjects,
  openProjectById,
  saveProjects,
  upsertProject
};
