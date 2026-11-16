import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BRAND, DOCTOR, FAQS, HOME_VISITS, PHOTOS, PROCESS, REVIEWS, SERVICES, WHY_US } from '../core/brand';
import { BodyMap } from '../shared/body-map';
import { CallbackForm } from '../shared/callback-form';
import { Icon } from '../shared/icon';
import { Photo } from '../shared/photo';

@Component({
  selector: 'k-home',
  imports: [RouterLink, Photo, Icon, BodyMap, CallbackForm],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly brand = BRAND;
  readonly doctor = DOCTOR;
  readonly photos = PHOTOS;
  readonly why = WHY_US;
  readonly services = SERVICES.filter((s) => s.slug !== 'home').slice(0, 6);
  readonly process = PROCESS;
  readonly home = HOME_VISITS;
  readonly reviews = REVIEWS;
  readonly faqs = FAQS;
  doctorPhotoFailed = false;
}
