import type {Grammar} from 'prismjs';
import type TurndownService from 'turndown';

declare global {
  interface Window {
    Prism: {
      highlightElement(element: Element): void;
      languages: Grammar;
    };
    TurndownService: typeof TurndownService;
    toMarkdown: (html: string) => string;
    turndownPluginGfm: {
      gfm: TurndownService.Plugin | TurndownService.Plugin[];
    };
  }

  interface Node {
    on(name: string, fn: EventListenerOrEventListenerObject): void;
  }

  interface Window {
    on(name: string, fn: EventListenerOrEventListenerObject): void;
    $<T extends string>(query: T, context?: ParentNode): import('typed-query-selector/parser.js').ParseSelector<T, Element>;
    $$<T extends string>(query: T, context?: ParentNode): NodeListOf<import('typed-query-selector/parser.js').ParseSelector<T, Element>>;
  }

  interface NodeList extends Array<Node> {
    on(name: string, fn: EventListenerOrEventListenerObject): void;
  }
}
