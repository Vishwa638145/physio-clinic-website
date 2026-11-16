import { Component, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { BRAND, HOURS_DISPLAY, SERVICES } from '../core/brand';
import { openStatus } from '../core/hours';
import { Icon } from '../shared/icon';
import { captureTrafficSource } from '../shared/traffic-source';
import { Wordmark } from '../shared/wordmark';

@Component({
  selector: 'k-site-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Wordmark, Icon],
  templateUrl: './site-layout.html',
  styleUrl: './site-layout.scss',
})
export class SiteLayout implements OnInit, OnDestroy {
  private router = inject(Router);
  readonly brand = BRAND;
  readonly hours = HOURS_DISPLAY;
  readonly services = SERVICES;
  readonly menu = signal(false);
  readonly scrolled = signal(false);
  readonly status = signal(openStatus());
  readonly year = new Date().getFullYear();
  private timer?: ReturnType<typeof setInterval>;
  private sub?: Subscription;

  ngOnInit(): void {
    captureTrafficSource();
    this.timer = setInterval(() => this.status.set(openStatus()), 60_000);
    this.sub = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.menu.set(false));
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
    this.sub?.unsubscribe();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 12);
  }
}
