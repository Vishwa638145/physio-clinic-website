import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { Wordmark } from '../shared/wordmark';
import { StudioState } from './studio-state';

@Component({
  selector: 'k-studio-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Wordmark],
  template: `
    <div class="shell">
      <aside class="side" [class.open]="menu()">
        <div class="side-top">
          <a routerLink="/studio" class="logo" aria-label="Ads Studio home"><k-wordmark tone="light" /></a>
          <button class="menu-btn" type="button" (click)="menu.set(!menu())" [attr.aria-expanded]="menu()" aria-controls="studio-nav">
            {{ menu() ? 'Close' : 'Menu' }}
          </button>
        </div>
        <nav id="studio-nav" aria-label="Studio">
          <a routerLink="/studio" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="current" (click)="menu.set(false)">Campaigns</a>
          <a routerLink="/studio/new" routerLinkActive="current" (click)="menu.set(false)">New ad</a>
          <a routerLink="/studio/enquiries" routerLinkActive="current" (click)="menu.set(false)">Enquiries</a>
          <a routerLink="/studio/settings" routerLinkActive="current" (click)="menu.set(false)">Meta connection</a>
        </nav>
        <div class="side-foot">
          @if (state.status(); as s) {
            <p class="conn">
              <span class="dot" [class.on]="s.connected"></span>
              @if (s.mode === 'demo') { Demo data } @else if (s.connected) { {{ s.user?.name }} } @else { Not connected }
            </p>
          }
          <p class="who">{{ auth.email() }}</p>
          <div class="foot-links">
            <a routerLink="/" target="_blank">View website</a>
            <button type="button" (click)="auth.signOut()">Sign out</button>
          </div>
        </div>
      </aside>

      <main class="main" id="main">
        @if (state.isDemo()) {
          <p class="demo-bar">
            You’re looking at demo data. Add the clinic’s Meta app details to the server’s <code>.env</code> to manage real ads.
            <a routerLink="/studio/settings">How to connect</a>
          </p>
        }
        <router-outlet />
      </main>
    </div>
  `,
  styleUrl: './studio-layout.scss',
})
export class StudioLayout implements OnInit {
  readonly auth = inject(AuthService);
  readonly state = inject(StudioState);
  readonly menu = signal(false);

  ngOnInit(): void {
    void this.state.load();
  }
}
