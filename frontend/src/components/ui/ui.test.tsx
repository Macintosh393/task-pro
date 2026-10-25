// @vitest-environment jsdom
import { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Button, FormField, Heading, Icon, IconButton, Input, Textarea } from './index';

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe('Button contract (#10)', () => {
  it('forwards native props/ref, defaults to button and permits one click', () => {
    const click = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    act(() =>
      root.render(
        <Button ref={ref} name="intent" value="save" onClick={click}>
          Save
        </Button>,
      ),
    );
    const button = host.querySelector('button')!;
    act(() => button.click());
    expect(click).toHaveBeenCalledTimes(1);
    expect(button.type).toBe('button');
    expect(button.name).toBe('intent');
    expect(button.value).toBe('save');
    expect(ref.current).toBe(button);
  });
  it.each([{ disabled: true }, { loading: true }])('blocks activation when %o', (props) => {
    const click = vi.fn();
    act(() =>
      root.render(
        <Button {...props} onClick={click}>
          Save
        </Button>,
      ),
    );
    const button = host.querySelector('button')!;
    act(() => button.click());
    expect(click).not.toHaveBeenCalled();
    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe('Save');
    expect(button.getAttribute('aria-busy')).toBe(props.loading ? 'true' : null);
  });
  it('submits only when explicitly asked', () => {
    const submit = vi.fn();
    act(() =>
      root.render(
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Button>Default</Button>
          <Button type="submit">Submit</Button>
        </form>,
      ),
    );
    act(() => host.querySelectorAll('button')[0].click());
    expect(submit).not.toHaveBeenCalled();
    act(() => host.querySelectorAll('button')[1].click());
    expect(submit).toHaveBeenCalledTimes(1);
  });
});
describe('Fields (#11)', () => {
  it.each([Input, Textarea])(
    'links label/help/error, merges descriptions and forwards input/ref',
    (Control) => {
      const change = vi.fn();
      const external = document.createElement('p');
      external.id = 'external';
      host.append(external);
      act(() =>
        root.render(
          <FormField label="Title" help="Help" error="Required">
            <Control aria-describedby="external" name="title" required onChange={change} />
          </FormField>,
        ),
      );
      const control = host.querySelector('input, textarea') as
        HTMLInputElement | HTMLTextAreaElement;
      expect(control.id).toBeTruthy();
      expect(host.querySelector('label')?.htmlFor).toBe(control.id);
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
        root.render(
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
      root.render(
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
    const ids = [...host.querySelectorAll('input,textarea')].map((el) => el.id);
    expect(new Set(ids).size).toBe(3);
    expect(ids[2]).toBe('explicit');
  });
  it('forwards refs, disabled and standalone accessible names', () => {
    const ref = createRef<HTMLInputElement>();
    act(() => root.render(<Input ref={ref} disabled aria-label="Title" />));
    expect(ref.current?.disabled).toBe(true);
    expect(ref.current?.getAttribute('aria-label')).toBe('Title');
  });
});
it('makes icons decorative or named and keeps IconButton named (#12)', () => {
  act(() =>
    root.render(
      <>
        <Icon name="plus" />
        <Icon name="trash" label="Delete" size={24} />
        <IconButton icon="close" aria-label="Close" />
      </>,
    ),
  );
  const icons = host.querySelectorAll('svg');
  expect(icons[0].getAttribute('aria-hidden')).toBe('true');
  expect(icons[1].getAttribute('role')).toBe('img');
  expect(icons[1].getAttribute('aria-label')).toBe('Delete');
  expect(icons[1].getAttribute('width')).toBe('24');
  expect(host.querySelector('button')?.getAttribute('aria-label')).toBe('Close');
  expect(icons[2].getAttribute('aria-hidden')).toBe('true');
});
it('keeps heading semantics independent from visual size', () => {
  act(() =>
    root.render(
      <Heading level={1} size="small">
        Title
      </Heading>,
    ),
  );
  expect(host.querySelector('h1')?.textContent).toBe('Title');
});
