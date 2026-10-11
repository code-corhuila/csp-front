import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SessionService } from './session.service';
import { SignInComponent } from './sign-in.component';

describe('SignInComponent', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'sign-in', component: SignInComponent }, { path: 'back', children: [] }, { path: '', children: [] }], withComponentInputBinding())],
    });
  });
  afterEach(() => sessionStorage.clear());

  const open = async (url = '/sign-in') => {
    const harness = await RouterTestingHarness.create(url);
    const element: HTMLElement = harness.routeNativeElement!;
    return {
      harness,
      textarea: element.querySelector('textarea')!,
      submit: element.querySelector<HTMLButtonElement>('button')!,
      fill(value: string) {
        this.textarea.value = value;
        this.textarea.dispatchEvent(new Event('input'));
        harness.detectChanges();
      },
    };
  };

  it('cannot be submitted without a token', async () => {
    const page = await open();

    expect(page.submit.disabled).toBeTrue();
  });

  it('keeps the trimmed token in the session and goes to the start address', async () => {
    const page = await open();
    page.fill('  abc  ');

    page.submit.click();
    await page.harness.fixture.whenStable();

    expect(TestBed.inject(SessionService).token()).toBe('abc');
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('goes back to the address the person was heading to', async () => {
    const page = await open('/sign-in?returnUrl=%2Fback');
    page.fill('abc');

    page.submit.click();
    await page.harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/back');
  });
});
