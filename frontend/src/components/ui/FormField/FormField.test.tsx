// @vitest-environment jsdom
import { act, createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FormField } from './FormField';
import { Input } from '../Input';
import { Textarea } from '../Textarea';
import { setupDomTest } from '../../../test/setupDomTest';

const dom = setupDomTest();

describe('Fields (#11)', () => {
  it.each([Input, Textarea])(
    'links label/help/error, merges descriptions and forwards input/ref',
    (Control) => {
      const change = vi.fn();
      const external = document.createElement('p');
      external.id = 'external';
      dom.host.append(external);
      act(() =>
        dom.root.render(
          <FormField label="Title" help="Help" error="Required">
            <Control aria-describedby="external" name="title" required onChange={change} />
          </FormField>,
        ),
      );
      const control = dom.host.querySelector('input, textarea') as
        HTMLInputElement | HTMLTextAreaElement;
      expect(control.id).toBeTruthy();
      expect(dom.host.querySelector('label')?.htmlFor).toBe(control.id);
      expect(control.getAttribute('aria-invalid')).toBe('true');
      expect(control.getAttribute('aria-describedby')).toBe(
        `${control.id}-help ${control.id}-error external`,
      );
      expect(document.getElementById(`${control.id}-error`)?.textContent).toBe('Required');
      expect(control.name).toBe('title');
      expect(control.required).toBe(true);
      const proto =
        control instanceof HTMLInputElement
          ? HTMLInputElement.prototype
          : HTMLTextAreaElement.prototype;
      act(() => {
        Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(control, 'Hello');
        control.dispatchEvent(new Event('input', { bubbles: true }));
      });
      expect(change).toHaveBeenCalledTimes(1);
      expect(control.value).toBe('Hello');
      const id = control.id;
      act(() =>
        dom.root.render(
          <FormField label="Title" help="Help">
            <Control value="Controlled" onChange={change} />
          </FormField>,
        ),
      );
      expect(control.id).toBe(id);
      expect(control.getAttribute('aria-invalid')).toBeNull();
      expect(control.getAttribute('aria-describedby')).toBe(`${id}-help`);
      expect(control.value).toBe('Controlled');
    },
  );
  it('keeps generated IDs unique and respects explicit field IDs', () => {
    act(() =>
      dom.root.render(
        <>
          <FormField label="One">
            <Input />
          </FormField>
          <FormField label="Two">
            <Textarea />
          </FormField>
          <FormField id="explicit" label="Three">
            <Input id="ignored-child-id" />
          </FormField>
        </>,
      ),
    );
    const ids = [...dom.host.querySelectorAll('input,textarea')].map((el) => el.id);
    expect(new Set(ids).size).toBe(3);
    expect(ids[2]).toBe('explicit');
  });
  it('forwards refs, disabled and standalone accessible names', () => {
    const ref = createRef<HTMLInputElement>();
    act(() => dom.root.render(<Input ref={ref} disabled aria-label="Title" />));
    expect(ref.current?.disabled).toBe(true);
    expect(ref.current?.getAttribute('aria-label')).toBe('Title');
  });
});
