import type {Grammar} from 'prismjs';
import type TurndownService from 'turndown';

declare global {
  interface Window {
    Prism: {
      highlightElement(element: Element): void;
      languages: Grammar;
    };
    TurndownService: typeof TurndownService;
    turndownPluginGfm: {
      gfm: TurndownService.Plugin | TurndownService.Plugin[];
    };
  }
}
