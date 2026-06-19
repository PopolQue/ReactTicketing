import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TicketTypeRow } from '../TicketTypeRow';

afterEach(cleanup);

describe('TicketTypeRow Component', () => {
  const mockType = {
    id: 'tt1',
    name: 'Standard',
    pricing: { kind: 'paid', priceInCents: 1000, currency: 'EUR' },
    capacity: 100,
    archived: false,
    visible: true,
  } as any;

  it('calls startEdit when edit button is clicked', () => {
    const startEdit = vi.fn();
    render(
        <table>
            <tbody>
                <TicketTypeRow
                    type={mockType}
                    isEditing={false}
                    editValues={{}}
                    setEditValues={vi.fn()}
                    editTimes={{ validFromDate: '', validFromTime: '', validUntilDate: '', validUntilTime: '' }}
                    setEditTimes={vi.fn()}
                    startEdit={startEdit}
                    saveTicketType={vi.fn()}
                    toggleArchive={vi.fn()}
                    formatDateTimeForTimezone={vi.fn()}
                />
            </tbody>
        </table>
    );
    
    fireEvent.click(screen.getByRole('button', { name: 'Edit ticket type Standard' }));
    expect(startEdit).toHaveBeenCalledWith(mockType);
  });

  it('calls saveTicketType when save button is clicked in edit mode', () => {
    const saveTicketType = vi.fn();
    render(
        <table>
            <tbody>
                <TicketTypeRow
                    type={mockType}
                    isEditing={true}
                    editValues={{ name: 'Standard Edit' }}
                    setEditValues={vi.fn()}
                    editTimes={{ validFromDate: '', validFromTime: '', validUntilDate: '', validUntilTime: '' }}
                    setEditTimes={vi.fn()}
                    startEdit={vi.fn()}
                    saveTicketType={saveTicketType}
                    toggleArchive={vi.fn()}
                    formatDateTimeForTimezone={vi.fn()}
                />
            </tbody>
        </table>
    );
    
    const saveButton = screen.getByRole('button', { name: 'Save changes for Standard' });
    fireEvent.click(saveButton);
    expect(saveTicketType).toHaveBeenCalledWith(mockType);
  });

  it('calls setEditValues when name changes in edit mode', () => {
    const setEditValues = vi.fn();
    render(
        <table>
            <tbody>
                <TicketTypeRow
                    type={mockType}
                    isEditing={true}
                    editValues={{}}
                    setEditValues={setEditValues}
                    editTimes={{ validFromDate: '', validFromTime: '', validUntilDate: '', validUntilTime: '' }}
                    setEditTimes={vi.fn()}
                    startEdit={vi.fn()}
                    saveTicketType={vi.fn()}
                    toggleArchive={vi.fn()}
                    formatDateTimeForTimezone={vi.fn()}
                />
            </tbody>
        </table>
    );
    
    const nameInput = screen.getByLabelText('Edit name for Standard');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    expect(setEditValues).toHaveBeenCalledWith({ name: 'New Name' });
  });

  it('calls setEditValues when capacity changes in edit mode', () => {
    const setEditValues = vi.fn();
    render(
        <table>
            <tbody>
                <TicketTypeRow
                    type={mockType}
                    isEditing={true}
                    editValues={{}}
                    setEditValues={setEditValues}
                    editTimes={{ validFromDate: '', validFromTime: '', validUntilDate: '', validUntilTime: '' }}
                    setEditTimes={vi.fn()}
                    startEdit={vi.fn()}
                    saveTicketType={vi.fn()}
                    toggleArchive={vi.fn()}
                    formatDateTimeForTimezone={vi.fn()}
                />
            </tbody>
        </table>
    );
    
    const capInput = screen.getByLabelText('Edit capacity for Standard');
    fireEvent.change(capInput, { target: { value: '200' } });
    expect(setEditValues).toHaveBeenCalledWith({ capacity: 200 });
  });

  it('calls setEditTimes when valid from time changes in edit mode', () => {
    const setEditTimes = vi.fn();
    render(
        <table>
            <tbody>
                <TicketTypeRow
                    type={mockType}
                    isEditing={true}
                    editValues={{}}
                    setEditValues={vi.fn()}
                    editTimes={{ validFromDate: '', validFromTime: '', validUntilDate: '', validUntilTime: '' }}
                    setEditTimes={setEditTimes}
                    startEdit={vi.fn()}
                    saveTicketType={vi.fn()}
                    toggleArchive={vi.fn()}
                    formatDateTimeForTimezone={vi.fn()}
                />
            </tbody>
        </table>
    );
    
    const timeInput = screen.getByLabelText('Edit valid from time for Standard');
    fireEvent.change(timeInput, { target: { value: '14:30' } });
    expect(setEditTimes).toHaveBeenCalledWith({ validFromDate: '', validFromTime: '14:30', validUntilDate: '', validUntilTime: '' });
  });

  it('calls setEditValues when visible changes in edit mode', () => {
    const setEditValues = vi.fn();
    render(
        <table>
            <tbody>
                <TicketTypeRow
                    type={mockType}
                    isEditing={true}
                    editValues={{}}
                    setEditValues={setEditValues}
                    editTimes={{ validFromDate: '', validFromTime: '', validUntilDate: '', validUntilTime: '' }}
                    setEditTimes={vi.fn()}
                    startEdit={vi.fn()}
                    saveTicketType={vi.fn()}
                    toggleArchive={vi.fn()}
                    formatDateTimeForTimezone={vi.fn()}
                />
            </tbody>
        </table>
    );
    
    const visibleInput = screen.getByLabelText('Edit visible status for Standard');
    fireEvent.click(visibleInput);
    expect(setEditValues).toHaveBeenCalledWith({ visible: false }); // since it was true initially via type.visible
  });

  it('calls setEditTimes when valid from date, until date, and until time changes in edit mode', () => {
    const setEditTimes = vi.fn();
    render(
        <table>
            <tbody>
                <TicketTypeRow
                    type={mockType}
                    isEditing={true}
                    editValues={{}}
                    setEditValues={vi.fn()}
                    editTimes={{ validFromDate: '', validFromTime: '', validUntilDate: '', validUntilTime: '' }}
                    setEditTimes={setEditTimes}
                    startEdit={vi.fn()}
                    saveTicketType={vi.fn()}
                    toggleArchive={vi.fn()}
                    formatDateTimeForTimezone={vi.fn()}
                />
            </tbody>
        </table>
    );
    
    const fromDateInput = screen.getByLabelText('Edit valid from date for Standard');
    fireEvent.change(fromDateInput, { target: { value: '2026-01-01' } });
    expect(setEditTimes).toHaveBeenCalledWith(expect.objectContaining({ validFromDate: '2026-01-01' }));

    const untilDateInput = screen.getByLabelText('Edit valid until date for Standard');
    fireEvent.change(untilDateInput, { target: { value: '2026-01-02' } });
    expect(setEditTimes).toHaveBeenCalledWith(expect.objectContaining({ validUntilDate: '2026-01-02' }));

    const untilTimeInput = screen.getByLabelText('Edit valid until time for Standard');
    fireEvent.change(untilTimeInput, { target: { value: '18:00' } });
    expect(setEditTimes).toHaveBeenCalledWith(expect.objectContaining({ validUntilTime: '18:00' }));
  });

  it('calls setEditValues when price changes in edit mode', () => {
    const setEditValues = vi.fn();
    render(
        <table>
            <tbody>
                <TicketTypeRow
                    type={mockType}
                    isEditing={true}
                    editValues={{}}
                    setEditValues={setEditValues}
                    editTimes={{ validFromDate: '', validFromTime: '', validUntilDate: '', validUntilTime: '' }}
                    setEditTimes={vi.fn()}
                    startEdit={vi.fn()}
                    saveTicketType={vi.fn()}
                    toggleArchive={vi.fn()}
                    formatDateTimeForTimezone={vi.fn()}
                />
            </tbody>
        </table>
    );
    
    const priceInputs = screen.getAllByRole('spinbutton');
    if(priceInputs.length > 0) {
        fireEvent.change(priceInputs[0], { target: { value: '20.00' } });
        expect(setEditValues).toHaveBeenCalledWith(expect.objectContaining({
            pricing: { kind: 'paid', priceInCents: 2000, currency: 'EUR' }
        }));
    }
  });

  it('calls setEditValues when currency changes in edit mode', () => {
    const setEditValues = vi.fn();
    render(
        <table>
            <tbody>
                <TicketTypeRow
                    type={mockType}
                    isEditing={true}
                    editValues={{}}
                    setEditValues={setEditValues}
                    editTimes={{ validFromDate: '', validFromTime: '', validUntilDate: '', validUntilTime: '' }}
                    setEditTimes={vi.fn()}
                    startEdit={vi.fn()}
                    saveTicketType={vi.fn()}
                    toggleArchive={vi.fn()}
                    formatDateTimeForTimezone={vi.fn()}
                />
            </tbody>
        </table>
    );

    const select = screen.getByLabelText('Currency');
    fireEvent.change(select, { target: { value: 'USD' } });
    expect(setEditValues).toHaveBeenCalledWith(expect.objectContaining({
        pricing: { kind: 'paid', priceInCents: 0, currency: 'USD' }
    }));
  });

  it('calls toggleArchive when archive button is clicked', () => {
    const toggleArchive = vi.fn();
    render(
        <table>
            <tbody>
                <TicketTypeRow
                    type={mockType}
                    isEditing={false}
                    editValues={{}}
                    setEditValues={vi.fn()}
                    editTimes={{ validFromDate: '', validFromTime: '', validUntilDate: '', validUntilTime: '' }}
                    setEditTimes={vi.fn()}
                    startEdit={vi.fn()}
                    saveTicketType={vi.fn()}
                    toggleArchive={toggleArchive}
                    formatDateTimeForTimezone={vi.fn()}
                />
            </tbody>
        </table>
    );
    
    fireEvent.click(screen.getByRole('button', { name: 'Archive ticket type Standard' }));
    expect(toggleArchive).toHaveBeenCalledWith(mockType);
  });
});
