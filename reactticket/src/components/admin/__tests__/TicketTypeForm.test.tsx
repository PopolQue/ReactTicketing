import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TicketTypeForm } from '../TicketTypeForm';

afterEach(cleanup);

describe('TicketTypeForm Component', () => {
  const mockNewType = {
    name: '',
    price: 0,
    currency: 'USD',
    capacity: 0,
    visible: true,
    startDate: '',
    startTime: '00:00',
    endDate: '',
    endTime: '23:59',
  };

  it('renders correctly', () => {
    render(
      <table>
        <tbody>
          <TicketTypeForm newType={mockNewType} setNewType={vi.fn()} addTicketType={vi.fn()} />
        </tbody>
      </table>
    );
    expect(screen.getByLabelText('New ticket type name')).toBeDefined();
  });

  it('calls setNewType when name input changes', () => {
    const setNewType = vi.fn();
    render(
      <table>
        <tbody>
          <TicketTypeForm newType={mockNewType} setNewType={setNewType} addTicketType={vi.fn()} />
        </tbody>
      </table>
    );
    fireEvent.change(screen.getByLabelText('New ticket type name'), {
      target: { value: 'Early Bird' },
    });
    expect(setNewType).toHaveBeenCalledWith({ ...mockNewType, name: 'Early Bird' });
  });

  it('calls setNewType when capacity changes', () => {
    const setNewType = vi.fn();
    render(
      <table>
        <tbody>
          <TicketTypeForm newType={mockNewType} setNewType={setNewType} addTicketType={vi.fn()} />
        </tbody>
      </table>
    );
    fireEvent.change(screen.getByLabelText('New ticket type capacity'), {
      target: { value: '50' },
    });
    expect(setNewType).toHaveBeenCalledWith({ ...mockNewType, capacity: 50 });
  });

  it('calls setNewType when startDate changes', () => {
    const setNewType = vi.fn();
    render(
      <table>
        <tbody>
          <TicketTypeForm newType={mockNewType} setNewType={setNewType} addTicketType={vi.fn()} />
        </tbody>
      </table>
    );
    fireEvent.change(screen.getByLabelText('New ticket type valid from date'), {
      target: { value: '2026-06-01' },
    });
    expect(setNewType).toHaveBeenCalledWith({ ...mockNewType, startDate: '2026-06-01' });
  });

  it('calls setNewType when startTime changes', () => {
    const setNewType = vi.fn();
    render(
      <table>
        <tbody>
          <TicketTypeForm newType={mockNewType} setNewType={setNewType} addTicketType={vi.fn()} />
        </tbody>
      </table>
    );
    fireEvent.change(screen.getByLabelText('New ticket type valid from time'), {
      target: { value: '10:00' },
    });
    expect(setNewType).toHaveBeenCalledWith({ ...mockNewType, startTime: '10:00' });
  });

  it('calls setNewType when endDate changes', () => {
    const setNewType = vi.fn();
    render(
      <table>
        <tbody>
          <TicketTypeForm newType={mockNewType} setNewType={setNewType} addTicketType={vi.fn()} />
        </tbody>
      </table>
    );
    fireEvent.change(screen.getByLabelText('New ticket type valid until date'), {
      target: { value: '2026-06-30' },
    });
    expect(setNewType).toHaveBeenCalledWith({ ...mockNewType, endDate: '2026-06-30' });
  });

  it('calls setNewType when endTime changes', () => {
    const setNewType = vi.fn();
    render(
      <table>
        <tbody>
          <TicketTypeForm newType={mockNewType} setNewType={setNewType} addTicketType={vi.fn()} />
        </tbody>
      </table>
    );
    fireEvent.change(screen.getByLabelText('New ticket type valid until time'), {
      target: { value: '18:00' },
    });
    expect(setNewType).toHaveBeenCalledWith({ ...mockNewType, endTime: '18:00' });
  });

  it('calls setNewType when visibility checkbox changes', () => {
    const setNewType = vi.fn();
    render(
      <table>
        <tbody>
          <TicketTypeForm newType={mockNewType} setNewType={setNewType} addTicketType={vi.fn()} />
        </tbody>
      </table>
    );
    fireEvent.click(screen.getByLabelText('New ticket type visible'));
    expect(setNewType).toHaveBeenCalledWith({ ...mockNewType, visible: false });
  });

  it('calls addTicketType when button is clicked', () => {
    const addTicketType = vi.fn();
    render(
      <table>
        <tbody>
          <TicketTypeForm
            newType={mockNewType}
            setNewType={vi.fn()}
            addTicketType={addTicketType}
          />
        </tbody>
      </table>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add new ticket type' }));
    expect(addTicketType).toHaveBeenCalled();
  });
});
