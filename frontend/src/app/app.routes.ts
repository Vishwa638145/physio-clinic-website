import { Routes } from '@angular/router';
import { studioGuard } from './core/auth.service';
import { BRAND } from './core/brand';
import { SiteLayout } from './site/site-layout';

const t = (page: string) => `${page} | ${BRAND.name}`;

export const routes: Routes = [
  {
    path: '',
    component: SiteLayout,
    children: [
      { path: '', loadComponent: () => import('./site/home').then((m) => m.Home), title: `${BRAND.name} | ${BRAND.descriptor}` },
      { path: 'about', loadComponent: () => import('./site/about').then((m) => m.About), title: t('About') },
      { path: 'services', loadComponent: () => import('./site/services').then((m) => m.Services), title: t('Services') },
      { path: 'home-physiotherapy', loadComponent: () => import('./site/home-physio').then((m) => m.HomePhysio), title: t('Physiotherapy at home') },
      { path: 'contact', loadComponent: () => import('./site/contact').then((m) => m.Contact), title: t('Book an appointment') },
      // older links (and existing ads) keep working
      { path: 'book', redirectTo: 'contact' },
      { path: 'treatments', redirectTo: 'services' },
    ],
  },
  { path: 'studio/sign-in', loadComponent: () => import('./studio/sign-in').then((m) => m.SignIn), title: t('Ads Studio sign-in') },
  {
    path: 'studio',
    canActivate: [studioGuard],
    loadComponent: () => import('./studio/studio-layout').then((m) => m.StudioLayout),
    children: [
      { path: '', loadComponent: () => import('./studio/overview').then((m) => m.Overview), title: t('Campaigns') },
      { path: 'new', loadComponent: () => import('./studio/composer').then((m) => m.Composer), title: t('New ad') },
      { path: 'enquiries', loadComponent: () => import('./studio/enquiries').then((m) => m.Enquiries), title: t('Enquiries') },
      { path: 'settings', loadComponent: () => import('./studio/settings').then((m) => m.Settings), title: t('Meta connection') },
    ],
  },
  { path: '**', redirectTo: '' },
];
