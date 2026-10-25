// @vitest-environment jsdom
import { act } from 'react';
import { expect, it, vi } from 'vitest';
import { AvatarUpload } from './AvatarUpload';
import { Avatar } from '../Avatar';
import { setupDomTest } from '../../../test/setupDomTest';

const dom = setupDomTest();

it('passes selected avatar files to the consumer and handles image failure', () => {
  const selected = vi.fn();
  act(() => dom.root.render(<AvatarUpload name="Profile" onFileSelect={selected} />));
  const input = dom.host.querySelector('input')!;
  const file = new File(['image'], 'profile.png', { type: 'image/png' });
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  act(() => input.dispatchEvent(new Event('change', { bubbles: true })));
  expect(selected).toHaveBeenCalledWith(file);
  expect(input.value).toBe('');
  act(() => dom.root.render(<Avatar name="Profile" src="broken.png" />));
  act(() => dom.host.querySelector('img')!.dispatchEvent(new Event('error')));
  expect(dom.host.querySelector('img')).toBeNull();
  expect(dom.host.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Profile');
  act(() => dom.root.render(<Avatar name="Profile" src="replacement.png" />));
  expect(dom.host.querySelector('img')?.getAttribute('src')).toBe('replacement.png');
});
