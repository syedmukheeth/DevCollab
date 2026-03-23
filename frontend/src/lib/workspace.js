const STORAGE_KEY = 'devcollab-local-workspace';

const createId = (prefix) => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(16).slice(2)}`;
};

export const createDefaultWorkspace = () => {
  const projectId = createId('project');
  const fileId = createId('file');
  return {
    project: {
      id: projectId,
      name: 'My DevCollab Project',
      description: 'Local workspace'
    },
    files: [
      {
        id: fileId,
        projectId,
        name: 'main.js',
        content: "console.log('Welcome to DevCollab local mode!');\n",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  };
};

export const loadWorkspace = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultWorkspace();
    const parsed = JSON.parse(raw);
    if (!parsed?.project || !Array.isArray(parsed?.files)) {
      return createDefaultWorkspace();
    }
    return parsed;
  } catch (error) {
    return createDefaultWorkspace();
  }
};

export const saveWorkspace = (workspace) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
};

export const createLocalFile = (projectId, name) => ({
  id: createId('file'),
  projectId,
  name,
  content: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});
