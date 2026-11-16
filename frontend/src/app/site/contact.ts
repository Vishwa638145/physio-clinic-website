import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { errorMessage } from '../core/auth.service';
import { BRAND, HOURS_DISPLAY, SERVICES } from '../core/brand';
import { openStatus } from '../core/hours';
import { MetaApi } from '../core/meta-api.service';
import { Icon } from '../shared/icon';
import { PageHeader } from '../shared/page-header';
import { trafficSource } from '../shared/traffic-source';

@Component({
  selector: 'k-contact',
  imports: [ReactiveFormsModule, Icon, PageHeader],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(MetaApi);
  private route = inject(ActivatedRoute);

  readonly brand = BRAND;
  readonly hours = HOURS_DISPLAY;
  readonly status = openStatus();
  readonly concerns = [...SERVICES.filter((s) => s.slug !== 'home').map((s) => s.name), 'Not sure yet'];
  readonly sending = signal(false);
  readonly sent = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    visitType: ['clinic' as 'clinic' | 'home'],
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^[+\d][\d\s-]{7,16}$/)]],
    email: ['', [Validators.email]],
    concern: ['Not sure yet', Validators.required],
    preferredSlot: ['Morning'],
    area: [''],
    address: [''],
    message: [''],
    website: [''],
  });

  private v = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly isHome = computed(() => this.v().visitType === 'home');

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    const concern = q.get('concern');
    if (concern && this.concerns.includes(concern)) this.form.controls.concern.setValue(concern);
    if (q.get('visit') === 'home') this.setVisit('home');
  }

  setVisit(type: 'clinic' | 'home'): void {
    const c = this.form.controls;
    c.visitType.setValue(type);
    if (type === 'home') {
      c.area.setValidators([Validators.required, Validators.minLength(2)]);
      c.address.setValidators([Validators.required, Validators.minLength(5)]);
    } else {
      c.area.clearValidators();
      c.address.clearValidators();
    }
    c.area.updateValueAndValidity();
    c.address.updateValueAndValidity();
  }

  showError(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  async submit(): Promise<void> {
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please check the highlighted fields.');
      return;
    }
    this.sending.set(true);
    try {
      const v = this.form.getRawValue();
      const home = v.visitType === 'home';
      await this.api.submitEnquiry({
        ...v,
        area: home ? v.area : '',
        address: home ? v.address : '',
        source: trafficSource(),
      });
      this.sent.set(true);
      document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      this.error.set(errorMessage(err, `We couldn’t send that. Please call ${BRAND.phone}.`));
    } finally {
      this.sending.set(false);
    }
  }
}
