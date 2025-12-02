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

  interface Node {
    on(name: string, fn: EventListenerOrEventListenerObject): void;
  }

  interface Window {
    on(name: string, fn: EventListenerOrEventListenerObject): void;
    $(selector: string): Element | null;
    $$(selector: string): NodeListOf<Element>;
  }

  interface NodeList extends Array<Node> {
    on(name: string, fn: EventListenerOrEventListenerObject): void;
  }
}
