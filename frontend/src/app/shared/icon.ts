import { Component, input } from '@angular/core';

export type IconName =
  | 'bone' | 'spine' | 'run' | 'joint' | 'shoulder' | 'brain' | 'balance' | 'home'
  | 'check' | 'phone' | 'whatsapp' | 'clock' | 'user' | 'clipboard' | 'arrow' | 'calendar'
  | 'star' | 'mail' | 'pin' | 'shield' | 'plus' | 'heart';

/** Line icon set, 24×24, stroke = currentColor. */
@Component({
  selector: 'k-icon',
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      @switch (name()) {
        @case ('bone') { <path d="M8 8l8 8" /><path d="M6.5 9.5a2 2 0 1 1-2-3.5 2 2 0 1 1 3.5-2" /><path d="M17.5 14.5a2 2 0 1 1 2 3.5 2 2 0 1 1-3.5 2" /> }
        @case ('spine') {
          <rect x="9" y="2.5" width="6" height="3.4" rx="1.2" /><rect x="8.6" y="7.4" width="6.8" height="3.4" rx="1.2" />
          <rect x="8.3" y="12.3" width="7.4" height="3.4" rx="1.2" /><rect x="8.8" y="17.2" width="6.4" height="3.4" rx="1.2" />
        }
        @case ('run') { <circle cx="15" cy="4.5" r="2" /><path d="M5 11l3-3h5l-2 5 3 3v5" /><path d="M11 13l-3 3H4" /><path d="M13 8l3 3h3" /> }
        @case ('joint') { <path d="M9 2.5v6.5a3 3 0 0 0 6 0V2.5" /><path d="M9 21.5V15a3 3 0 0 1 6 0v6.5" /><path d="M7 12h10" stroke-dasharray="2 2" /> }
        @case ('shoulder') { <circle cx="12" cy="5" r="2.5" /><path d="M5 21v-7c0-3 2-5.5 5-5.5h4c3 0 5 2.5 5 5.5v7" /><path d="M19 14l2.5-4" /> }
        @case ('brain') {
          <path d="M12 4.5v15M12 6a3 3 0 0 0-5.5-1.5A3 3 0 0 0 4 9a3 3 0 0 0 .5 5.5A3 3 0 0 0 8 19.5a3 3 0 0 0 4 0" />
          <path d="M12 6a3 3 0 0 1 5.5-1.5A3 3 0 0 1 20 9a3 3 0 0 1-.5 5.5 3 3 0 0 1-3.5 5 3 3 0 0 1-4 0" />
        }
        @case ('balance') { <circle cx="12" cy="4" r="2" /><path d="M12 6.5v7l-2 7.5M12 13.5l3 3" /><path d="M5 9.5h14" /><path d="M17 16.5l1.5 4" /> }
        @case ('home') { <path d="M3.5 11L12 4l8.5 7" /><path d="M6 9.5V20h12V9.5" /><path d="M10 20v-5h4v5" /> }
        @case ('check') { <path d="M5 12.5l4.5 4.5L19 7.5" /> }
        @case ('phone') { <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /> }
        @case ('whatsapp') { <path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.4z" /><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 1c-1-.4-2.5-1.9-2.9-2.9l1-1-1-2z" /> }
        @case ('clock') { <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /> }
        @case ('user') { <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /> }
        @case ('clipboard') { <rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1" /><path d="M9 10h6M9 14h6M9 18h3" /> }
        @case ('arrow') { <path d="M5 12h14M13 6l6 6-6 6" /> }
        @case ('calendar') { <rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /> }
        @case ('star') { <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /> }
        @case ('mail') { <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 6.5l8.5 6.5 8.5-6.5" /> }
        @case ('pin') { <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /> }
        @case ('shield') { <path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /> }
        @case ('plus') { <path d="M12 5v14M5 12h14" /> }
        @case ('heart') { <path d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3c0 5.4-7.5 10-7.5 10z" /> }
      }
    </svg>
  `,
  styles: `:host { display: inline-flex; width: 1.5em; height: 1.5em; flex: none; } svg { width: 100%; height: 100%; }`,
})
export class Icon {
  readonly name = input.required<IconName | string>();
}
