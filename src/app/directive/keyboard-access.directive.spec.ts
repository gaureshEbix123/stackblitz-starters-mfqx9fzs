import { ElementRef } from '@angular/core';
import { KeyboardAccessDirective } from './keyboard-access.directive';

describe('KeyboardAccessDirective', () => {
  it('should create an instance', () => {
    const directive = new KeyboardAccessDirective({ nativeElement: document.createElement('div') } as ElementRef<HTMLElement>);
    expect(directive).toBeTruthy();
  });
});
