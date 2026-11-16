import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BRAND, FAQS, HOME_VISITS, PHOTOS, SERVICES } from '../core/brand';
import { CallbackForm } from '../shared/callback-form';
import { Icon } from '../shared/icon';
import { Photo } from '../shared/photo';

/** Landing page for home visits. Also the natural destination for "physio at home" Meta ads. */
@Component({
  selector: 'k-home-physio',
  imports: [RouterLink, CallbackForm, Icon, Photo],
  template: `
    <section class="hero">
      <div class="wrap grid">
        <div class="copy">
          <nav aria-label="Breadcrumb" class="crumbs"><a routerLink="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">Home visits</span></nav>
          <h1>Physiotherapy at home in {{ brand.city }}</h1>
          <p class="lede">Expert, one-to-one physiotherapy in the comfort of your home. Ideal after surgery, after a stroke, or for elderly family members who find travelling difficult.</p>
          <ul class="ticks">
            @for (g of home.goodFor; track g) { <li><k-icon name="check" />{{ g }}</li> }
          </ul>
          @if (home.areas.length) { <p class="areas"><k-icon name="pin" />Visiting {{ home.areas.join(', ') }}</p> }
        </div>
        <div class="form-card">
          <h2>Book a home visit</h2>
          <p>Share your details and we’ll call you to fix a time.</p>
          <k-callback-form visit="home" layout="stacked" />
        </div>
      </div>
    </section>

    <section class="wrap steps-sec" aria-labelledby="hs-h">
      <div class="center-head">
        <p class="kicker">How it works</p>
        <h2 id="hs-h" class="sec-title">Home physiotherapy in four simple steps</h2>
      </div>
      <ol class="steps">
        @for (s of home.steps; track s.title; let i = $index) {
          <li><span class="n num">{{ i + 1 }}</span><h3>{{ s.title }}</h3><p>{{ s.text }}</p></li>
        }
      </ol>
    </section>

    <section class="split">
      <div class="wrap split-grid">
        <k-photo class="img" [src]="photo.src" [alt]="photo.alt" label="Home visit" />
        <div>
          <p class="kicker">Why home physiotherapy</p>
          <h2 class="sec-title">Better recovery where you feel most comfortable</h2>
          <ul class="benefits">
            @for (b of home.benefits; track b) { <li><k-icon name="check" />{{ b }}</li> }
          </ul>
          <a [href]="brand.whatsappHref" target="_blank" rel="noopener" class="btn btn-primary"><k-icon name="whatsapp" />Ask on WhatsApp</a>
        </div>
      </div>
    </section>

    <section class="wrap svcs" aria-labelledby="hsv-h">
      <div class="center-head">
        <p class="kicker">Available at home</p>
        <h2 id="hsv-h" class="sec-title">Treatments we offer at home</h2>
      </div>
      <ul>
        @for (s of services; track s.slug) {
          <li>
            <a routerLink="/contact" fragment="book" [queryParams]="{ visit: 'home', concern: s.name }">
              <span class="ic"><k-icon [name]="s.icon" /></span>
              <span><strong>{{ s.name }}</strong><small>{{ s.short }}</small></span>
            </a>
          </li>
        }
      </ul>
    </section>

    <section class="wrap faq">
      <h2 class="sec-title">Common questions</h2>
      <div class="faq-list">
        @for (f of faqs; track f.q) {
          <details><summary>{{ f.q }}</summary><p>{{ f.a }}</p></details>
        }
      </div>
    </section>

    <section class="wrap cta-wrap">
      <div class="cta">
        <div><h2>Arrange a home visit today</h2><p>Call us and we’ll take care of the rest.</p></div>
        <div class="actions">
          <a [href]="brand.phoneHref" class="btn btn-light"><k-icon name="phone" />{{ brand.phone }}</a>
          <a routerLink="/contact" fragment="book" [queryParams]="{ visit: 'home' }" class="btn cta-ghost">Book online</a>
        </div>
      </div>
    </section>
  `,
  styleUrl: './home-physio.scss',
})
export class HomePhysio {
  readonly brand = BRAND;
  readonly home = HOME_VISITS;
  readonly photo = PHOTOS.homeVisit;
  readonly services = SERVICES.filter((s) => s.atHome && s.slug !== 'home');
  readonly faqs = FAQS.filter((f) => /home|referral|insurance|sessions/i.test(f.q));
}
