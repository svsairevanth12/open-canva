import type { ProjectDocument } from '../types/editor';

type TemplateDescriptor = {
  category: string;
  id: string;
  name: string;
};

const TEMPLATE_REGISTRY: TemplateDescriptor[] = [
  { category: 'Presentation', id: 'tmpl-presentation-modern', name: 'Modern Deck' },
  { category: 'Social media', id: 'tmpl-social-launch', name: 'Product Launch Post' },
  { category: 'Video', id: 'tmpl-video-story', name: 'Story Reel Intro' },
  { category: 'Website', id: 'tmpl-website-landing', name: 'Landing Hero' },
  { category: 'Email', id: 'tmpl-email-newsletter', name: 'Newsletter Block' }
];

function listTemplates(): TemplateDescriptor[] {
  /**
   * var: none
   * type: void
   * desc: Returns static template registry entries for home filtering.
   */
  return TEMPLATE_REGISTRY;
}

function buildTemplateProject(templateId: string): ProjectDocument {
  /**
   * var: templateId
   * type: string
   * desc: Template identifier used to build starter project payload.
   */
  const template = TEMPLATE_REGISTRY.find((item) => item.id === templateId) ?? TEMPLATE_REGISTRY[0];
  return {
    id: `project-${Date.now()}`,
    name: template.name,
    pages: [
      {
        id: 'page-1',
        name: 'Page 1',
        objects: []
      }
    ],
    updatedAt: new Date().toISOString(),
    version: 1
  };
}

export {
  buildTemplateProject,
  listTemplates
};
