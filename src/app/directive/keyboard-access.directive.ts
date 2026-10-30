import { Directive, HostListener, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';

/**
 * Keyboard access for inputs and dropdowns (app-wide).
 * Apply once on the app root (e.g. the div that wraps router-outlet) so that:
 * - Tab: works normally for all inputs.
 * - Enter: toggles native / mat-checkbox & mat-radio (Enter is not default in browsers); opens jqx/custom dropdowns.
 * - Arrow Up/Down: navigate list items (jqx handles its own; custom lists use li focus).
 *
 * Works for: form inputs, mat-form-field, mat-select, mat-autocomplete, and standalone jqx ComboBox/DropDownList.
 *
 * For jqxGrid: this directive helps when focus is already inside a grid cell's combobox (event bubbles here).
 * Grid-specific handling (handlekeyboardnavigation, grid host keyup blocker, createeditor attach) is still
 * required via JqxGridKeyboardDirective or app-jqx-grid, because the grid consumes keys before they bubble.
 */
@Directive({
  selector: '[appKeyboardAccess]',
  standalone: true
})
export class KeyboardAccessDirective implements OnInit, OnDestroy {

  /** When false, Enter does not trigger synthetic open on combobox/dropdown hosts. */
  @Input() enableEnterOpen = true;
  /** When false, Arrow Up/Down does not move focus between list options. */
  @Input() enableArrowNavigation = true;

  private static readonly ALLOWED_TARGET_TAGS = ['INPUT', 'TEXTAREA', 'SELECT', 'DIV', 'SPAN'] as const;
  private static readonly ARROW_NAV_CONTAINER_SELECTOR =
    '[role="listbox"], .dropdown-menu, .mat-mdc-autocomplete-panel, .mat-autocomplete-panel';
  private static readonly DROPDOWN_TRIGGER_SELECTOR =
    '.dropdown, .mat-select, .mat-mdc-select, [role="combobox"]';

  private keyupHandler = (event: KeyboardEvent) => this.handleKeyup(event);
  private removeKeyupListener?: () => void;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    const host = this.el.nativeElement as HTMLElement;
    host.addEventListener('keyup', this.keyupHandler, true);
    this.removeKeyupListener = () => host.removeEventListener('keyup', this.keyupHandler, true);
  }

  ngOnDestroy(): void {
    this.removeKeyupListener?.();
  }

  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    const target = event.target as Node | null;
    const host = this.el.nativeElement as HTMLElement;
    if (!target || !host.contains(target)) return;
    if (target.nodeType !== 1) return;

    const htmlTarget = target as HTMLElement;
    if (!this.shouldHandleKeyboardEvent(htmlTarget)) return;

    const key = event.key;
    if (key === 'Tab') return;

    const toggleInput = this.resolveNativeCheckboxOrRadioInput(htmlTarget);

    // Browsers toggle checkboxes with Space; Enter usually does nothing. Programmatic click matches Space + Angular forms.
    if (key === 'Enter' && toggleInput) {
      this.onEnterNativeCheckboxOrRadio(toggleInput, event);
      return;
    }

    const jqxWidget = toggleInput ? null : this.findJqxWidget(htmlTarget);
    if (jqxWidget) {
      this.handleJqxKeydown(jqxWidget, key, event);
      return;
    }

    // Don't intercept Arrow keys for Material autocomplete – let it handle option navigation
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      if (this.isMatAutocompleteContext(htmlTarget)) return;
    }

    switch (key) {
      case 'Enter':
        this.openDropdown(htmlTarget, event);
        break;
      case 'ArrowDown':
        this.navigateDown(htmlTarget, event);
        break;
      case 'ArrowUp':
        this.navigateUp(htmlTarget, event);
        break;
    }
  }

  /**
   * Resolves the real checkbox/radio input for native controls and Angular Material mat-checkbox / mat-radio-button
   * (focus may be on the native input, label text, or touch target).
   */
  private resolveNativeCheckboxOrRadioInput(el: HTMLElement): HTMLInputElement | null {
    if (el.tagName === 'INPUT') {
      const input = el as HTMLInputElement;
      const t = input.type?.toLowerCase() ?? '';
      if (t === 'checkbox' || t === 'radio') return input;
      return null;
    }
    const matCb = el.closest('mat-checkbox');
    if (matCb) {
      return (
        matCb.querySelector<HTMLInputElement>('input.mdc-checkbox__native-control, input[type="checkbox"]') ??
        null
      );
    }
    const matRadio = el.closest('mat-radio-button');
    if (matRadio) {
      return (
        matRadio.querySelector<HTMLInputElement>('input.mdc-radio__native-control, input[type="radio"]') ?? null
      );
    }
    return null;
  }

  /** Enter does not toggle native checkbox/radio in most UAs; programmatic click matches Space and fires (change). */
  private onEnterNativeCheckboxOrRadio(input: HTMLInputElement, event: KeyboardEvent): void {
    if (input.disabled) return;
    event.preventDefault();
    input.click();
  }

  /** Same as isAllowedKeyboardTarget, plus focus on nodes inside mat-checkbox / mat-radio-button (label, touch target). */
  private shouldHandleKeyboardEvent(target: HTMLElement): boolean {
    if (this.isAllowedKeyboardTarget(target)) return true;
    return !!(
      target.closest('mat-checkbox, mat-radio-button') &&
      this.resolveNativeCheckboxOrRadioInput(target)
    );
  }

  /** Only handle keys when the event target is an editable, allowed element type. */
  private isAllowedKeyboardTarget(target: HTMLElement): boolean {
    if (!KeyboardAccessDirective.ALLOWED_TARGET_TAGS.includes(target.tagName as (typeof KeyboardAccessDirective.ALLOWED_TARGET_TAGS)[number])) {
      return false;
    }
    if (target.isContentEditable) return false;

    const el = target as HTMLInputElement & HTMLSelectElement;
    if (el.disabled) return false;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      const input = target as HTMLInputElement;
      const type = input.type?.toLowerCase() ?? '';
      // Material may set readonly on the hidden native checkbox; Space/Enter still must work.
      if (type !== 'checkbox' && type !== 'radio' && input.readOnly) return false;
    }
    return true;
  }

  /**
   * Finds listbox / dropdown panel within at most 5 ancestor levels (matches closest() but capped).
   */
  private findArrowNavContainer(start: HTMLElement): HTMLElement | null {
    let el: HTMLElement | null = start;
    let depth = 0;
    const sel = KeyboardAccessDirective.ARROW_NAV_CONTAINER_SELECTOR;
    while (el && el !== document.body && depth < 5) {
      if (typeof el.matches === 'function' && el.matches(sel)) {
        return el;
      }
      el = el.parentElement;
      depth++;
    }
    return null;
  }

  /** Stop keyup from reaching the grid (capture phase in ngOnInit) so jqx dropdown stays open after releasing Enter/Arrows. */
  private handleKeyup(event: KeyboardEvent) {
    const target = event.target as Node | null;
    const host = this.el.nativeElement as HTMLElement;
    if (!target || !host.contains(target)) return;

    const key = event.key;
    if (key !== 'Enter' && key !== 'ArrowDown' && key !== 'ArrowUp') return;

    const htmlTarget = target as HTMLElement;
    if (this.resolveNativeCheckboxOrRadioInput(htmlTarget)) return;

    const jqxWidget = this.findJqxWidget(htmlTarget);
    if (jqxWidget) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof (event as any).stopImmediatePropagation === 'function') (event as any).stopImmediatePropagation();
    }
  }

  /** True when focus is in a Material autocomplete input or inside its option panel (don't steal Arrow keys). */
  private isMatAutocompleteContext(target: HTMLElement): boolean {
    if (target.closest?.('.mat-mdc-autocomplete-panel, .mat-autocomplete-panel')) return true;
    const autocomplete = target.getAttribute?.('aria-autocomplete') === 'list' ||
      target.getAttribute?.('aria-haspopup') === 'listbox';
    if (autocomplete && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return true;
    return false;
  }

  /** Walk up from element to find a node that has jqx ComboBox or DropDownList (requires jQuery). */
  private findJqxWidget(from: HTMLElement): { $el: any; type: 'combobox' | 'dropdownlist' } | null {
    const win = typeof window !== 'undefined' ? (window as any) : null;
    const $ = win?.$;
    if (typeof $ !== 'function') return null;

    let el: HTMLElement | null = from;
    while (el && el !== document.body) {
      const $el = $(el);
      try {
        if (typeof $el.jqxComboBox === 'function') return { $el, type: 'combobox' };
        if (typeof $el.jqxDropDownList === 'function') return { $el, type: 'dropdownlist' };
      } catch (_) {}
      el = el.parentElement;
    }
    return null;
  }

  /**
   * Same Enter/Arrow behavior for jqx ComboBox and DropDownList.
   * Used for standalone dropdowns and when focus is inside a grid cell's combobox (event reached us).
   * Grid still needs its own handlekeyboardnavigation + keyup blocker so the grid doesn't consume keys first.
   */
  private handleJqxKeydown(
    widget: { $el: any; type: 'combobox' | 'dropdownlist' },
    key: string,
    event: KeyboardEvent
  ): void {
    const method = widget.type === 'combobox' ? 'jqxComboBox' : 'jqxDropDownList';
    const api = widget.$el[method];

    if (key === 'Enter') {
      try {
        const isOpened = api('isOpened');
        if (!isOpened) {
          api('open');
          event.preventDefault();
        }
      } catch (_) {}
    }

    // Only block arrows when the list is closed (grid/app would steal them). When open, let jqx navigate items.
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      try {
        const isOpened = api('isOpened');
        if (!isOpened) {
          event.preventDefault();
          event.stopPropagation();
          if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
        }
      } catch (_) {}
    }
  }

  openDropdown(element: HTMLElement, event: KeyboardEvent) {
    if (!this.enableEnterOpen) return;
    // jqx is already handled above; here only non-jqx
    if (element.closest(KeyboardAccessDirective.DROPDOWN_TRIGGER_SELECTOR)) {
      element.click();
      event.preventDefault();
    }
  }

  navigateDown(element: HTMLElement, event: KeyboardEvent) {
    if (!this.enableArrowNavigation) return;
    const container = this.findArrowNavContainer(element);
    if (!container) return;

    const items = container.querySelectorAll<HTMLElement>('li[role="option"], li');
    const active = document.activeElement;
    const index = Array.from(items).indexOf(active as HTMLElement);

    if (items.length && index < items.length - 1) {
      const next = items[index + 1];
      next.focus();
      next.scrollIntoView({ block: 'nearest' });
      event.preventDefault();
    }
  }

  navigateUp(element: HTMLElement, event: KeyboardEvent) {
    if (!this.enableArrowNavigation) return;
    const container = this.findArrowNavContainer(element);
    if (!container) return;

    const items = container.querySelectorAll<HTMLElement>('li[role="option"], li');
    const active = document.activeElement;
    const index = Array.from(items).indexOf(active as HTMLElement);

    if (items.length && index > 0) {
      const prev = items[index - 1];
      prev.focus();
      prev.scrollIntoView({ block: 'nearest' });
      event.preventDefault();
    }
  }
}
