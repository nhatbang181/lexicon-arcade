// @vitest-environment jsdom
import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { KeyHint } from './components/KeyHint';
import { FeedbackPanel } from './components/FeedbackPanel';
import { Modal } from './components/Modal';
import { Sheet } from './components/Sheet';
import { Button } from './components/Button';

afterEach(() => {
  cleanup();
});

describe('T3-A A1 · Design system tokens & accessibility', () => {
  it('KeyHint dùng cỡ chữ ≥ 12px (text-xs, không còn text-[11px])', () => {
    render(<KeyHint keyName="Enter" />);
    const kbd = screen.getByLabelText('Phím tắt Enter');
    expect(kbd.className).toContain('text-xs');
    expect(kbd.className).not.toContain('text-[11px]');
  });

  it('FeedbackPanel giữ chip phím tắt ≥ 12px và nút Báo item sai ≥ 44px', () => {
    const onNext = vi.fn();
    const onFlag = vi.fn();
    render(
      <FeedbackPanel
        open
        status="wrong"
        title="Chưa đúng"
        correctAnswer="sustainable"
        explanation="Cần tính từ trước danh từ."
        onNext={onNext}
        onFlagItem={onFlag}
      />,
    );

    const kbd = screen.getByLabelText('Phím tắt Enter');
    expect(kbd.className).toContain('text-xs');

    const flagBtn = screen.getByRole('button', { name: /Báo item sai/i });
    expect(flagBtn.className).toContain('min-h-[44px]');
    expect(flagBtn.className).toContain('text-xs');
    fireEvent.click(flagBtn);
    expect(onFlag).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Tiếp/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('Button primary dùng token --color-on-accent cho chữ trên nền nhấn', () => {
    render(
      <Button variant="primary" skill="vocab">
        Bắt đầu
      </Button>,
    );
    const btn = screen.getByRole('button', { name: 'Bắt đầu' });
    expect(btn.style.color).toBe('var(--color-on-accent)');
  });

  it('Modal gọi e.preventDefault() khi đóng bằng Esc, bẫy Tab và trả focus về nút mở', () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Mở modal
          </button>
          <Modal
            open={open}
            onClose={() => setOpen(false)}
            title="Xác nhận"
            footer={
              <button type="button" onClick={() => setOpen(false)}>
                Lưu
              </button>
            }
          >
            <button type="button">Hành động phụ</button>
          </Modal>
        </div>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Mở modal' });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(labelledBy).not.toBe('modal-title');
    expect(document.getElementById(labelledBy!)?.textContent).toBe('Xác nhận');

    const closeBtn = screen.getByRole('button', { name: 'Đóng hộp thoại' });
    const saveBtn = screen.getByRole('button', { name: 'Lưu' });

    // Focus phải vào trong dialog
    expect(dialog.contains(document.activeElement)).toBe(true);

    // Tab ở phần tử cuối vòng về phần tử đầu
    saveBtn.focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.activeElement).toBe(closeBtn);

    // Shift+Tab ở phần tử đầu vòng về phần tử cuối
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(saveBtn);

    // Escape gọi preventDefault() và đóng hộp thoại, trả focus về nút mở
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    fireEvent(window, escEvent);
    expect(escEvent.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it('Sheet gọi e.preventDefault() khi đóng bằng Esc, bẫy Tab và trả focus về nút mở', () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Mở bảng
          </button>
          <Sheet
            open={open}
            onClose={() => setOpen(false)}
            title="Chọn chế độ"
            side="bottom"
            footer={<button type="button">Xong</button>}
          >
            <button type="button">Luyện tập</button>
          </Sheet>
        </div>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Mở bảng' });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy!)?.textContent).toBe('Chọn chế độ');

    const closeBtn = screen.getByRole('button', { name: 'Đóng bảng' });
    const doneBtn = screen.getByRole('button', { name: 'Xong' });

    doneBtn.focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.activeElement).toBe(closeBtn);

    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    fireEvent(window, escEvent);
    expect(escEvent.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });
});
