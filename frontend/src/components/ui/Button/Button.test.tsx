// @vitest-environment jsdom
import { act, createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { setupDomTest } from '../../../test/setupDomTest';

const dom = setupDomTest();

describe('Button contract (#10)', () => {
  it('forwards native props/ref, defaults to button and permits one click', () => {
    const click = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    act(() =>
      dom.root.render(
        <Button ref={ref} name="intent" value="save" onClick={click}>
          Save
        </Button>,
      ),
    );
    const button = dom.host.querySelector('button')!;
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
      dom.root.render(
        <Button {...props} onClick={click}>
          Save
        </Button>,
      ),
    );
    const button = dom.host.querySelector('button')!;
    act(() => button.click());
    expect(click).not.toHaveBeenCalled();
    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe('Save');
    expect(button.getAttribute('aria-busy')).toBe(props.loading ? 'true' : null);
  });
  it('submits only when explicitly asked', () => {
    const submit = vi.fn();
    act(() =>
      dom.root.render(
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
    act(() => dom.host.querySelectorAll('button')[0].click());
    expect(submit).not.toHaveBeenCalled();
    act(() => dom.host.querySelectorAll('button')[1].click());
    expect(submit).toHaveBeenCalledTimes(1);
  });
});
