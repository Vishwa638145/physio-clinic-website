import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BRAND, DOCTOR, PHOTOS, PROCESS, WHY_US } from '../core/brand';
import { Icon } from '../shared/icon';
import { PageHeader } from '../shared/page-header';
import { Photo } from '../shared/photo';

@Component({
  selector: 'k-about',
  imports: [RouterLink, Icon, PageHeader, Photo],
  template: `
    <k-page-header title="About the physiotherapist" crumb="About" [lede]="'Meet ' + doctor.name + ', who will look after you at every visit.'" />

    <section class="wrap profile">
      <div class="visual">
        <div class="portrait">
          @if (!failed) {
            <img [src]="doctor.photo" [alt]="doctor.name" (error)="failed = true" />
          } @else {
            <div class="mono" aria-hidden="true"><span>{{ doctor.initials }}</span></div>
          }
        </div>
        <dl class="stats">
          <div><dt>Experience</dt><dd class="num">{{ doctor.experienceYears }}+ years</dd></div>
          <div><dt>Qualifications</dt><dd>{{ doctor.qualifications }}</dd></div>
        </dl>
      </div>
      <div class="copy">
        <h2>{{ doctor.name }}</h2>
        <p class="role">{{ doctor.title }}</p>
        <p class="intro">{{ doctor.intro }}</p>
        @for (p of doctor.bio; track p) { <p class="bio">{{ p }}</p> }

        <h3>Qualifications and training</h3>
        <ul class="creds">@for (c of doctor.credentials; track c) { <li><k-icon name="check" />{{ c }}</li> }</ul>

        <h3>Areas of focus</h3>
        <div class="focus">@for (f of doctor.focus; track f) { <span>{{ f }}</span> }</div>

        <div class="actions">
          <a routerLink="/contact" fragment="book" class="btn btn-primary"><k-icon name="calendar" />Book a consultation</a>
          <a [href]="brand.whatsappHref" target="_blank" rel="noopener" class="btn btn-ghost"><k-icon name="whatsapp" />Ask a question</a>
        </div>
      </div>
    </section>

    <section class="values">
      <div class="wrap">
        <h2 class="sec-title">How I work with patients</h2>
        <ul>
          @for (w of why; track w.title) {
            <li><span class="ic"><k-icon [name]="w.icon" /></span><h3>{{ w.title }}</h3><p>{{ w.text }}</p></li>
          }
        </ul>
      </div>
    </section>

    <section class="wrap approach">
      <k-photo class="img" [src]="photos.consult.src" [alt]="photos.consult.alt" label="Consultation" />
      <div>
        <h2 class="sec-title">What to expect at your first visit</h2>
        <ol>
          @for (p of process; track p.title; let i = $index) {
            <li><span class="n num">{{ i + 1 }}</span><div><h3>{{ p.title }}</h3><p>{{ p.text }}</p></div></li>
          }
        </ol>
      </div>
    </section>
  `,
  styles: `
    .profile { display: grid; grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr); gap: clamp(32px, 6vw, 80px); padding-top: clamp(48px, 7vw, 96px); padding-bottom: clamp(56px, 8vw, 104px); align-items: start; }
    @media (max-width: 900px) { .profile { grid-template-columns: 1fr; } }
    .visual { position: sticky; top: 110px; display: grid; gap: 16px; }
    @media (max-width: 900px) { .visual { position: static; max-width: 460px; } }
    .portrait { aspect-ratio: 4 / 5; border-radius: 28px; overflow: hidden; box-shadow: var(--shadow-md); }
    .portrait img { width: 100%; height: 100%; object-fit: cover; }
    .mono { width: 100%; height: 100%; display: grid; place-items: center; background: linear-gradient(160deg, var(--primary) 0%, #127a76 100%); }
    .mono span { font-size: clamp(3rem, 8vw, 5.5rem); font-weight: 800; color: rgba(255,255,255,0.92); }
    .stats { margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .stats div { background: var(--sky); border-radius: var(--r-md); padding: 14px 16px; }
    dt { font-size: var(--t-xs); color: var(--muted); font-weight: 600; }
    dd { margin: 2px 0 0; font-weight: 750; color: var(--primary); }
    h2 { font-size: var(--t-4xl); font-weight: 800; }
    .role { color: var(--accent); font-weight: 700; margin-top: 6px; }
    .intro { margin-top: 22px; font-size: var(--t-xl); line-height: 1.6; color: var(--ink); font-weight: 500; }
    .bio { margin-top: 16px; color: var(--muted); line-height: 1.8; }
    .copy h3 { font-size: var(--t-lg); font-weight: 750; margin: 34px 0 14px; }
    .creds { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
    .creds li { display: flex; gap: 10px; font-weight: 600; color: var(--ink-2); }
    .creds k-icon { width: 22px; height: 22px; padding: 4px; border-radius: 50%; background: var(--accent-soft); color: var(--accent); }
    .focus { display: flex; flex-wrap: wrap; gap: 8px; }
    .focus span { padding: 7px 14px; border-radius: 999px; background: var(--sky); border: 1px solid var(--line); font-size: var(--t-sm); font-weight: 600; }
    .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 36px; }
    .values { background: var(--sky); padding: clamp(64px, 8vw, 104px) 0; }
    .values ul { list-style: none; margin: 36px 0 0; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
    @media (max-width: 960px) { .values ul { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 520px) { .values ul { grid-template-columns: 1fr; } }
    .values li { background: #fff; border-radius: var(--r-lg); padding: 26px; box-shadow: var(--shadow-sm); display: grid; gap: 10px; align-content: start; }
    .values h3 { font-size: var(--t-lg); font-weight: 750; }
    .values p { color: var(--muted); font-size: var(--t-sm); line-height: 1.7; }
    .ic { width: 50px; height: 50px; border-radius: 14px; display: grid; place-items: center; background: var(--primary); color: #fff; }
    .ic k-icon { width: 24px; height: 24px; }
    .approach { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(32px, 6vw, 80px); align-items: center; padding-top: clamp(64px, 8vw, 104px); padding-bottom: clamp(64px, 8vw, 104px); }
    @media (max-width: 900px) { .approach { grid-template-columns: 1fr; } }
    .img { aspect-ratio: 5 / 4; border-radius: 28px; box-shadow: var(--shadow-md); }
    ol { list-style: none; margin: 28px 0 0; padding: 0; display: grid; gap: 20px; }
    ol li { display: grid; grid-template-columns: 48px 1fr; gap: 16px; }
    .n { width: 48px; height: 48px; border-radius: 50%; display: grid; place-items: center; background: var(--primary-soft); color: var(--primary); font-weight: 800; }
    ol h3 { font-size: var(--t-lg); font-weight: 750; }
    ol p { color: var(--muted); font-size: var(--t-sm); line-height: 1.7; margin-top: 2px; }
  `,
})
export class About {
  readonly brand = BRAND;
  readonly doctor = DOCTOR;
  readonly why = WHY_US;
  readonly process = PROCESS;
  readonly photos = PHOTOS;
  failed = false;
}
