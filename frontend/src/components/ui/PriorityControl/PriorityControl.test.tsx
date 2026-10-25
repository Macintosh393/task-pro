// @vitest-environment jsdom
import { act, useState } from 'react';
import { expect, it, vi } from 'vitest';
import { PriorityControl, type Priority } from './PriorityControl';
import { BoardIconPicker, type BoardIcon } from '../BoardIconPicker';
import { setupDomTest } from '../../../test/setupDomTest';

const dom = setupDomTest();

it('keeps priority and icon selection independent, named and controlled', () => {
  function Selections() {
    const [priority, setPriority] = useState<Priority>('none');
    const [icon, setIcon] = useState<BoardIcon>('project');
    return (
      <>
        <PriorityControl value={priority} onChange={setPriority} />
        <BoardIconPicker value={icon} onChange={setIcon} />
      </>
    );
  }
  act(() => dom.root.render(<Selections />));
  const low = dom.host.querySelector<HTMLInputElement>('[value="low"]')!;
  const star = dom.host.querySelector<HTMLInputElement>('[value="star"]')!;
  act(() => {
    low.click();
    star.click();
  });
  expect(low.checked).toBe(true);
  expect(star.checked).toBe(true);
  expect(low.name).not.toBe(star.name);
  expect(dom.host.querySelector('[value="none"]:checked')).toBeNull();
  expect(dom.host.querySelectorAll('input:checked')).toHaveLength(2);
  const change = vi.fn();
  act(() => dom.root.render(<PriorityControl value="low" disabled onChange={change} />));
  act(() => dom.host.querySelector<HTMLInputElement>('[value="high"]')!.click());
  expect(change).not.toHaveBeenCalled();
});
