declare module 'turndown-plugin-gfm' {
  import type {Plugin} from 'turndown';
  export const gfm: Plugin | Plugin[];
  export const tables: Plugin;
  export const strikethrough: Plugin;
  export const taskListItems: Plugin;
}
