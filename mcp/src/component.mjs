import { ComponentInput } from './schema.mjs';
export function createComponent(input) {
  const { config, behavior, action, size } = ComponentInput.parse(input);
  const settings = { appearance: config, behavior, action };
  return { package: '@ai-calypse/avatar-studio', minimumVersion: '0.2.0', settings, size,
    html: `<agent-robot-avatar id="studio-avatar" size="${size}"></agent-robot-avatar>`,
    javascript: `import { configureAvatar, exportAvatar } from '@ai-calypse/avatar-studio';\nconst avatar = document.getElementById('studio-avatar');\nconfigureAvatar(avatar, ${JSON.stringify(settings)});\n// Optional download: await exportAvatar(avatar, { format: 'gif' });`,
    instructions: 'Install @ai-calypse/avatar-studio >=0.2.0. Mount the HTML first, then run the module code in your browser application. Pointer interaction and looping require a live component. SVG/PNG/GIF tools produce image files, not interactive components.' };
}
