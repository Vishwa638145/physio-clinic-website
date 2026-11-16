import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SERVICES } from '../core/brand';
import { Icon } from '../shared/icon';
import { PageHeader } from '../shared/page-header';
import { Photo } from '../shared/photo';

@Component({
  selector: 'k-services',
  imports: [RouterLink, Icon, Photo, PageHeader],
  template: `
    <k-page-header title="Our services" lede="One-to-one physiotherapy for pain, injury and recovery, at the clinic or in your home.">
      <nav class="jump" aria-label="Jump to a service">
        @for (s of services; track s.slug) { <a [routerLink]="[]" [fragment]="s.slug"><k-icon [name]="s.icon" />{{ s.name }}</a> }
      </nav>
    </k-page-header>

    <div class="wrap list">
      @for (s of services; track s.slug; let odd = $odd) {
        <article [id]="s.slug" class="row" [class.flip]="odd">
          <k-photo class="img" [src]="s.image" [alt]="''" />
          <div class="copy">
            <span class="ic"><k-icon [name]="s.icon" /></span>
            <h2>{{ s.name }}</h2>
            <p class="desc">{{ s.description }}</p>
            <div class="cols">
              <div>
                <h3>Helps with</h3>
                <ul>@for (x of s.helpsWith; track x) { <li><k-icon name="check" />{{ x }}</li> }</ul>
              </div>
              <div>
                <h3>Our approach</h3>
                <ul>@for (x of s.approach; track x) { <li><k-icon name="check" />{{ x }}</li> }</ul>
              </div>
            </div>
            <div class="foot">
              <a class="btn btn-primary btn-sm" routerLink="/contact" fragment="book" [queryParams]="{ concern: s.name, visit: s.slug === 'home' ? 'home' : null }">Book an appointment</a>
              @if (s.atHome && s.slug !== 'home') { <span class="athome"><k-icon name="home" />Also available at home</span> }
            </div>
          </div>
        </article>
      }
    </div>
  `,
  styles: `
    .jump { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 28px; }
    .jump a {
      display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 999px;
      background: #fff; border: 1px solid var(--line); text-decoration: none; font-weight: 600; font-size: var(--t-sm); color: var(--ink-2);
      k-icon { width: 18px; height: 18px; color: var(--accent); }
      &:hover { border-color: var(--primary); color: var(--primary); }
    }
    .list { padding-top: clamp(48px, 7vw, 96px); padding-bottom: clamp(64px, 8vw, 110px); display: grid; gap: clamp(56px, 8vw, 104px); }
    .row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: clamp(28px, 5vw, 72px); align-items: center; scroll-margin-top: 110px; }
    .row.flip .img { order: 2; }
    @media (max-width: 860px) { .row { grid-template-columns: 1fr; } .row.flip .img { order: 0; } }
    .img { aspect-ratio: 4 / 3; border-radius: 28px; box-shadow: var(--shadow-md); }
    .ic { width: 52px; height: 52px; border-radius: 16px; display: grid; place-items: center; background: var(--accent-soft); color: var(--accent); margin-bottom: 16px; }
    .ic k-icon { width: 26px; height: 26px; }
    h2 { font-size: var(--t-3xl); font-weight: 780; }
    .desc { margin-top: 12px; color: var(--muted); font-size: var(--t-lg); line-height: 1.7; }
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 26px 0; }
    @media (max-width: 520px) { .cols { grid-template-columns: 1fr; } }
    h3 { font-size: var(--t-md); font-weight: 750; margin-bottom: 10px; }
    ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
    li { display: flex; gap: 8px; align-items: flex-start; font-size: var(--t-sm); color: var(--ink-2); }
    li k-icon { width: 18px; height: 18px; color: var(--accent); margin-top: 2px; }
    .foot { display: flex; flex-wrap: wrap; gap: 14px 20px; align-items: center; }
    .athome { display: inline-flex; align-items: center; gap: 6px; font-size: var(--t-sm); font-weight: 650; color: var(--primary); }
    .athome k-icon { width: 18px; height: 18px; }
  `,
})
export class Services {
  readonly services = SERVICES;
}
